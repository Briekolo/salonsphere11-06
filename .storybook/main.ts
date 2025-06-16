// @ts-nocheck
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: ['@storybook/addon-viewport'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
};

export default config; 