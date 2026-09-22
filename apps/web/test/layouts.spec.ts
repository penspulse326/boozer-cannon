import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AuthLayout from '~/layouts/auth.vue';
import DefaultLayout from '~/layouts/default.vue';

describe('Layout Architecture', () => {
  it('renders default layout with slot content', () => {
    // Arrange & Act
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          AddRecipeModal: true,
          AppFooter: true,
          AppHeader: true,
          AppToast: true,
        },
      },
      slots: {
        default: '<div id="test-content">Cocktail Catalog</div>',
      },
    });

    // Assert
    expect(wrapper.find('#test-content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Cocktail Catalog');
  });

  it('renders auth layout with slot content and return link', () => {
    // Arrange & Act
    const wrapper = mount(AuthLayout, {
      global: {
        stubs: {
          AppToast: true,
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
      slots: {
        default: '<div id="login-form">Login Form</div>',
      },
    });

    // Assert
    expect(wrapper.find('#login-form').exists()).toBe(true);
    expect(wrapper.text()).toContain('BarCraft');
    expect(wrapper.text()).toContain('返回酒譜首頁');
  });
});
