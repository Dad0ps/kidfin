import { useState, useEffect, useCallback } from 'react';
import { getItems, getEpisodes, getCollectionItems, getItemById, getVirtualFolders } from '../api/jellyfin';
import { useApp } from '../context/AppContext';
import { isRatingAllowed } from '../utils/ratings';

function filterByRating(items, maxRating) {
  if (!maxRating) return items;
  return items.filter((item) => isRatingAllowed(item.OfficialRating, maxRating));
}

export function useAllItems() {
  const { currentProfile } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile) return;
    setLoading(true);
    const params = {
      IncludeItemTypes: 'Movie,Series,BoxSet',
      SortBy: 'SortName',
      SortOrder: 'Ascending',
    };
    if (currentProfile.allowedLibraryId) {
      params.ParentId = currentProfile.allowedLibraryId;
    }
    getItems(params)
      .then((data) => setItems(filterByRating(data.Items || [], currentProfile.maxRating)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [currentProfile]);

  return { items, loading };
}

export function useItemDetail(itemId) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    getItemById(itemId)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [itemId]);

  return { item, loading };
}

export function useEpisodes(seriesId) {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seriesId) return;
    setLoading(true);
    getEpisodes(seriesId)
      .then((data) => setEpisodes(data.Items || []))
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, [seriesId]);

  return { episodes, loading };
}

export function useCollectionItems(collectionId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectionId) return;
    setLoading(true);
    getCollectionItems(collectionId)
      .then((data) => setItems(data.Items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [collectionId]);

  return { items, loading };
}

export function useVirtualFolders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    getVirtualFolders()
      .then(setFolders)
      .catch(() => setFolders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { folders, loading, refresh };
}
