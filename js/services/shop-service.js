// shop-service.js

import { shops } from "../data/shops-data.js";
import { items } from "../data/items-data.js";

export function getShopIdsForPlace(place) {
  return Array.isArray(place?.shopIds)
    ? place.shopIds
    : [];
}

export function hasShopForPlace(place) {
  return getShopIdsForPlace(place).length > 0;
}

export function getShopById(shopId) {
  return shops.find(shop => shop.shopId === shopId) || null;
}

export function getItemById(itemId) {
  return items.find(item => item.itemId === itemId) || null;
}

export function getShopsForPlace(place) {
  return getShopIdsForPlace(place).map(shopId => {
    const shop = getShopById(shopId);

    if (!shop) {
      return {
        shopId,
        shop: null,
        items: []
      };
    }

    return {
      shopId,
      shop,
      items: Array.isArray(shop.itemIds)
        ? shop.itemIds.map(itemId => ({
            itemId,
            item: getItemById(itemId)
          }))
        : []
    };
  });
}
