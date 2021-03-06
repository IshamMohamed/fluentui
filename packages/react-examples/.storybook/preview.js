// @ts-check
import * as React from 'react';
import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { configure, addParameters, addDecorator } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withPerformance } from 'storybook-addon-performance';
import { withCompatThemeProvider, withFluentProvider, withKeytipLayer, withStrictMode } from '@fluentui/storybook';

addDecorator(withPerformance);
addDecorator(withInfo());
addDecorator(withKeytipLayer);
if (
  ['react-button', 'react-cards', 'react-checkbox', 'react-slider', 'react-tabs', 'react-toggle'].includes(
    'PACKAGE_NAME',
  )
) {
  initializeIcons();
  addDecorator(withCompatThemeProvider);
  addDecorator(withStrictMode);
}
if (
  [
    'react-avatar',
    'react-badge',
    'react-button',
    'react-image',
    'react-link',
    'react-menu',
    'react-text',
    'react-components',
  ].includes('PACKAGE_NAME')
) {
  addDecorator(withFluentProvider);
  addDecorator(withStrictMode);
}

addParameters({
  a11y: {
    manual: true,
  },
});

configure(loadStories, module);

/**
 * @typedef {{
 *   default: { title: string };
 *   [subStoryName: string]: React.FunctionComponent | { title: string };
 * }} Story
 * @typedef {{ [exportName: string]: React.ComponentType }} ComponentModule
 */
function loadStories() {
  /** @type {Map<string, Story>} */
  const stories = new Map();

  /** @type {__WebpackModuleApi.RequireContext[]} */
  const contexts = [
    // This will be updated by preview-loader with the actual current package name
    require.context('../src/PACKAGE_NAME', true, /\.(Example|stories)\.tsx$/),
  ];

  // @ts-ignore
  if ('PACKAGE_NAME' === 'react' || 'PACKAGE_NAME' === 'react-components') {
    // For the @fluentui/react storybook, also show the examples of re-exported component packages.
    // preview-loader will replace REACT_ DEPS with the actual list.
    // Note that the regex intentionally goes only one directory below the package name
    // (the first `\w+`, which will be the component name) to avoid picking up "next" examples
    // which are under src/pkg-name/ComponentName/next/ComponentName.
    contexts.push(require.context('../src', true, /(REACT_DEPS)\/\w+\/[\w.]+\.(Example|stories)\.tsx$/));
  }

  for (const req of contexts) {
    req.keys().forEach(key => {
      generateStoriesFromExamples(key, stories, req);
    });
  }

  // convert stories Set to array
  const sorted = [...stories.values()].sort((s1, s2) => (s1.default.title > s2.default.title ? 1 : -1));
  return sorted;
}

/**
 * @param {string} key - key for the module in require.context (the relative path to the module
 * from the root path passed to require.context)
 * @param {Map<string, Story>} stories
 * @param {__WebpackModuleApi.RequireContext} req
 */
function generateStoriesFromExamples(key, stories, req) {
  // Depending on the starting point of the context, and the package layout, the key will be like one of these:
  //   ./ComponentName/ComponentName.Something.Example.tsx
  //   ./next/ComponentName/ComponentName.Something.Example.tsx
  //   ./package-name/ComponentName/ComponentName.Something.Example.tsx
  const segments = key.split('/');
  if (segments.length < 3) {
    return;
  }

  const componentName = segments.length === 3 ? segments[1] : `${segments[2]} (${segments[1]})`;

  if (!stories.has(componentName)) {
    stories.set(componentName, {
      default: {
        title: 'Components/' + componentName,
      },
    });
  }

  const storyName = segments
    .slice(-1)[0]
    .replace('.tsx', '')
    .replace(/\./g, '_');

  const story = stories.get(componentName);
  const exampleModule = /** @type {(key: string) => ComponentModule} */ (req)(key);

  for (let moduleExport of Object.keys(exampleModule)) {
    const ExampleComponent = exampleModule[moduleExport];
    const subStoryName = moduleExport || storyName;

    if (typeof ExampleComponent === 'function') {
      if (ExampleComponent.prototype.render) {
        // class component
        story[subStoryName] = () => React.createElement(ExampleComponent);
      } else {
        // function component
        story[subStoryName] = /** @type {React.FunctionComponent} */ (ExampleComponent);
      }
    }
  }
}

export const parameters = {
  options: {
    storySort: {
      order: ['Concepts/Introduction', 'Concepts', 'Components'],
    },
  },
};
