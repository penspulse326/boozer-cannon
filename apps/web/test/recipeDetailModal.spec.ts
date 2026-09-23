import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { Recipe } from '~/types/cocktail';

import RecipeDetailModal from '~/components/recipe/recipe-detail-modal.vue';

describe('RecipeDetailModal Component', () => {
  const mockRecipe: Recipe = {
    author: 'BarCraft 首席調酒師',
    base: 'Gin',
    desc: '經典義大利苦甜開胃調酒',
    flavors: ['flavor_bitter', 'flavor_herbal'],
    garnish: '柳橙皮卷',
    glass: '古典杯',
    ice: '方冰',
    id: '10000000-0000-0000-0000-000000000001',
    ingredients: [
      { abv: 47.3, amount: '30', brandText: 'Tanqueray No. 10', name: '琴酒', unit: 'ml' },
      { abv: 25.0, amount: '30', brandText: 'Campari Bitter', name: '金巴利苦酒', unit: 'ml' },
      {
        abv: 16.5,
        amount: '30',
        brandText: 'Carpano Antica Formula',
        name: '甜苦艾酒',
        unit: 'ml',
      },
    ],
    isFav: false,
    isLiked: false,
    likes: 42,
    method: 'Stir (攪拌法)',
    nameEn: 'Negroni',
    nameZh: '內格羅尼',
    steps: ['將所有材料倒入調酒杯中', '加入大量冰塊均勻攪拌 30 秒', '濾入裝有大冰塊的古典杯'],
  };

  it('should not render anything when recipe is null', () => {
    const wrapper = mount(RecipeDetailModal, {
      props: {
        recipe: null,
      },
    });

    expect(wrapper.find('[data-testid="recipe-detail-modal"]').exists()).toBe(false);
  });

  it('should render recipe details correctly when recipe is provided', () => {
    const wrapper = mount(RecipeDetailModal, {
      attachTo: document.body,
      props: {
        recipe: mockRecipe,
      },
    });

    expect(document.body.textContent).toContain('內格羅尼');
    expect(document.body.textContent).toContain('Negroni');
    expect(document.body.textContent).toContain('Gin');
    expect(document.body.textContent).toContain('古典杯');
    expect(document.body.textContent).toContain('方冰');
    expect(document.body.textContent).toContain('柳橙皮卷');
    expect(document.body.textContent).toContain('Tanqueray No. 10');
    expect(document.body.textContent).toContain('BarCraft 首席調酒師');
    wrapper.unmount();
  });

  it('should simulate technique dilution when technique button is clicked', async () => {
    const wrapper = mount(RecipeDetailModal, {
      attachTo: document.body,
      props: {
        recipe: mockRecipe,
      },
    });

    expect(document.body.textContent).toContain('+22%');

    const shakeBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Shake 搖盪'),
    );
    expect(shakeBtn).toBeDefined();
    shakeBtn?.click();
    await wrapper.vm.$nextTick();

    expect(document.body.textContent).toContain('+33%');

    const resetBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('恢復預設'),
    );
    expect(resetBtn).toBeDefined();
    resetBtn?.click();
    await wrapper.vm.$nextTick();

    expect(document.body.textContent).toContain('+22%');
    wrapper.unmount();
  });

  it('should emit toggle-like, toggle-fav, and close events', async () => {
    const wrapper = mount(RecipeDetailModal, {
      attachTo: document.body,
      props: {
        recipe: mockRecipe,
      },
    });

    const closeBtn = document.body.querySelector(
      'button.absolute.top-4.right-4',
    ) as HTMLButtonElement | null;
    expect(closeBtn).toBeDefined();
    closeBtn?.click();
    expect(wrapper.emitted('close')).toBeTruthy();

    const likeBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('42'),
    );
    expect(likeBtn).toBeDefined();
    likeBtn?.click();
    expect(wrapper.emitted('toggle-like')?.[0]).toEqual([mockRecipe.id]);

    const favBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('收藏'),
    );
    expect(favBtn).toBeDefined();
    favBtn?.click();
    expect(wrapper.emitted('toggle-fav')?.[0]).toEqual([mockRecipe.id]);
    wrapper.unmount();
  });
});
