import { useEffect, useState } from 'react'
import { GradientSelectionGrid, SelectionGrid, flexoki } from 'ui-bits'
import { loadDocsTerrainTileAssets } from '../terrainAssets'

const buildLocalId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const selectionGridSwatches = [
  { id: 'rose', label: 'Rose', color: flexoki.red['400'] },
  { id: 'sun', label: 'Sun', color: flexoki.yellow['300'] },
  { id: 'mint', label: 'Mint', color: flexoki.green['400'] },
  { id: 'sky', label: 'Sky', color: flexoki.blue['400'] },
  { id: 'iris', label: 'Iris', color: flexoki.purple['400'] },
  { id: 'berry', label: 'Berry', color: flexoki.magenta['400'] },
  { id: 'ocean', label: 'Ocean', color: flexoki.cyan['400'] },
  { id: 'ember', label: 'Ember', color: flexoki.orange['400'] },
]

const selectionGridFolders = [
  {
    id: 'warm',
    label: 'Warm',
    items: [
      selectionGridSwatches[0],
      selectionGridSwatches[1],
      selectionGridSwatches[5],
      selectionGridSwatches[7],
    ],
  },
  {
    id: 'cool',
    label: 'Cool',
    items: [
      selectionGridSwatches[2],
      selectionGridSwatches[3],
      selectionGridSwatches[4],
      selectionGridSwatches[6],
    ],
    defaultCollapsed: true,
  },
]

type TerrainGridItem = {
  id: string
  label: string
  thumbSrc: string
  fullSrc: string
}

export default function SelectionGridExample() {
  const [selectedSwatch, setSelectedSwatch] = useState<string | null>(selectionGridSwatches[0]?.id ?? null)
  const [selectedFolderSwatch, setSelectedFolderSwatch] = useState<string | null>(
    selectionGridFolders[0]?.items[0]?.id ?? null,
  )
  const activeSwatch = selectionGridSwatches.find((swatch) => swatch.id === selectedSwatch)
  const activeFolderSwatch = selectionGridSwatches.find((swatch) => swatch.id === selectedFolderSwatch)
  const [terrainItems, setTerrainItems] = useState<TerrainGridItem[]>([])
  const [selectedTerrainId, setSelectedTerrainId] = useState<string | null>(null)
  const activeTerrain = terrainItems.find((item) => item.id === selectedTerrainId) ?? null

  useEffect(() => {
    let cancelled = false
    loadDocsTerrainTileAssets().then((assets) => {
      if (cancelled) return
      const nextItems = assets.map((asset, index) => ({
        id: `terrain-${index}-${asset.name}`,
        label: asset.name.replace(/\.png$/i, ''),
        thumbSrc: asset.url,
        fullSrc: asset.url,
      }))
      setTerrainItems(nextItems)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (selectedTerrainId != null) return
    if (terrainItems.length === 0) return
    setSelectedTerrainId(terrainItems[0]?.id ?? null)
  }, [selectedTerrainId, terrainItems])

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: flexoki.base['200'],
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            border: `1px solid ${flexoki.base['600']}`,
            background: activeSwatch?.color ?? flexoki.base['600'],
          }}
        />
        {activeSwatch?.label ?? 'None'}
      </div>
      <SelectionGrid
        items={selectionGridSwatches}
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        getPreview={(item) => ({ type: 'color', color: item.color })}
        selectedKey={selectedSwatch}
        onSelect={(key) => setSelectedSwatch(key)}
        layoutGap="6px"
        colorA={flexoki.base['50']}
        colorB={flexoki.base['100']}
        maxHeightUnits={12}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: flexoki.base['200'],
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            border: `1px solid ${flexoki.base['600']}`,
            background: activeFolderSwatch?.color ?? flexoki.base['600'],
          }}
        />
        {activeFolderSwatch?.label ?? 'None'}
      </div>
      <SelectionGrid
        folders={selectionGridFolders}
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        getPreview={(item) => ({ type: 'color', color: item.color })}
        selectedKey={selectedFolderSwatch}
        onSelect={(key) => setSelectedFolderSwatch(key)}
        layoutGap="6px"
        colorA={flexoki.base['700']}
        colorB={flexoki.base['100']}
        maxHeightUnits={12}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: flexoki.base['200'],
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            border: `1px solid ${flexoki.base['600']}`,
            background: flexoki.base['800'],
            overflow: 'hidden',
          }}
        >
          {activeTerrain && (
            <img
              src={activeTerrain.thumbSrc}
              alt={activeTerrain.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
        {activeTerrain?.label ?? 'Terrain Tiles'}
      </div>
      <SelectionGrid
        folders={[
          {
            id: 'terrain-tiles',
            label: 'Terrain Tiles',
            items: terrainItems,
            addTile: {
              label: 'Add terrain tiles',
              accept: 'image/*',
              multiple: true,
              autoAppend: false,
              createItem: (file, url) => ({
                id: buildLocalId('terrain'),
                label: file.name.replace(/\.[^/.]+$/, ''),
                thumbSrc: url,
                fullSrc: url,
              }),
              onAddItems: (items) => {
                setTerrainItems((prev) => [...prev, ...items])
              },
            },
          },
        ]}
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        getPreview={(item) => ({ type: 'image', src: item.thumbSrc })}
        selectedKey={selectedTerrainId}
        onSelect={(key, item) => {
          setSelectedTerrainId(item?.id ?? key)
        }}
        layoutGap="6px"
        colorA={flexoki.base['700']}
        colorB={flexoki.base['100']}
        maxHeightUnits={12}
      />
      <GradientSelectionGrid
        previewDarkMode
        terrainAssets={loadDocsTerrainTileAssets}
        layoutGap="6px"
        colorA={flexoki.base['50']}
        colorB={flexoki.base['100']}
        maxHeightUnits={20}
      />
    </>
  )
}
