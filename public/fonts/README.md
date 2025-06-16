# Salonsphere Fonts

## Aeonik Font toevoegen

Plaats de volgende Aeonik font bestanden in deze map:

### Benodigde bestanden:
- `AeonikRegular.woff2` - Voor gewone tekst
- `AeonikMedium.woff2` - Voor titels en headings

### Ondersteunde formaten:
- **WOFF2** (aanbevolen voor beste performance)
- **WOFF** (fallback)
- **TTF** (als backup)

### Na het toevoegen van de fonts:
1. De fonts worden automatisch geladen via `globals.css`
2. Aeonik Medium wordt gebruikt voor alle titels en headings
3. Aeonik Regular wordt gebruikt voor alle gewone tekst
4. Inter wordt gebruikt als fallback font

### Bestandsstructuur:
```
public/fonts/
├── AeonikRegular.woff2
├── AeonikMedium.woff2
└── README.md
```

### Font implementatie:
De fonts zijn gedefinieerd in `app/globals.css` met:
- `font-family: 'Aeonik', 'Inter', sans-serif`
- CSS custom properties voor verschillende font weights
- Automatische fallback naar systeem fonts 