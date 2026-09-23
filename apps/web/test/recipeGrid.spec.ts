import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RecipeGrid from '~/components/recipe/recipe-grid.vue';
import { DEFAULT_RECIPES } from '~/utils/seedData';

describe('RecipeGrid Component', () => {
  it('should render skeleton grid when isLoading is true', () => {
    // Arrange & Act
    const wrapper = mount(RecipeGrid, {
      props: {
        isLoading: true,
        recipes: [],
      },
    });

    // Assert
    expect(wrapper.find('[data-testid="recipe-skeleton-grid"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="recipe-grid"]').exists()).toBe(false);
  });

  it('should render error state and emit retry when error is provided', async () => {
    // Arrange
    const wrapper = mount(RecipeGrid, {
      props: {
        error: '連線逾時，請重試',
        isLoading: false,
        recipes: [],
      },
    });

    // Assert
    const errorBox = wrapper.find('[data-testid="recipe-error-state"]');
    expect(errorBox.exists()).toBe(true);
    expect(errorBox.text()).toContain('連線逾時，請重試');

    // Act
    const retryBtn = errorBox.find('button');
    await retryBtn.trigger('click');

    // Assert
    expect(wrapper.emitted('retry')).toBeTruthy();
  });

  it('should render recipe cards when recipes are loaded', () => {
    // Arrange & Act
    const wrapper = mount(RecipeGrid, {
      props: {
        error: null,
        isLoading: false,
        recipes: [DEFAULT_RECIPES[0]!],
      },
    });

    // Assert
    expect(wrapper.find('[data-testid="recipe-grid"]').exists()).toBe(true);
    expect(wrapper.text()).toContain(DEFAULT_RECIPES[0]!.nameZh);
  });
});
