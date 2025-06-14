# Logo Component - Salonsphere

## Hoe het logo vervangen

Het `Logo` component in `components/layout/Logo.tsx` is gebouwd om eenvoudig het Salonsphere logo toe te voegen.

### Stap 1: Logo bestanden toevoegen
Plaats je logo bestanden in de `public` folder:
```
public/
├── brand/logo.svg    # Primary logo (SVG aanbevolen)
├── brand/salon-logo.png # Hoofdlogo (PNG of SVG)
└── brand/logo-icon.png  # Optioneel icoon
```

### Stap 2: Logo component updaten
Open `components/layout/Logo.tsx` en vervang de `LogoIcon` functie:

```tsx
// Vervang deze sectie:
const LogoIcon = () => (
  <div className={`
    ${sizeConfig.iconContainer} 
    bg-[#02011F] 
    rounded-xl 
    flex items-center justify-center
    ${iconClassName}
  `}>
    {/* Replace this with your actual logo image when available */}
    <Image 
      src="/logo-icon.svg" 
      alt="Salonsphere" 
      width={size === 'lg' ? 32 : size === 'md' ? 24 : 16}
      height={size === 'lg' ? 32 : size === 'md' ? 24 : 16}
    />
  </div>
)
```

### Stap 3: Volledige logo optie
Voor een volledig logo (icoon + tekst in één bestand):
```tsx
// Voor een volledig logo bestand
<Image 
  src="/logo.svg" 
  alt="Salonsphere" 
  width={size === 'lg' ? 200 : size === 'md' ? 150 : 100}
  height={size === 'lg' ? 60 : size === 'md' ? 45 : 30}
/>
```

### Waar het logo gebruikt wordt:
- **Sidebar**: `components/layout/Sidebar.tsx` (klein formaat)
- **Auth pagina's**: `components/auth/AuthPageLayout.tsx` (medium formaat)
- **Headers**: Kan toegevoegd worden aan TopBar components

### Logo varianten:
- `variant="full"` - Icoon + tekst (default)
- `variant="icon"` - Alleen icoon
- `variant="text"` - Alleen tekst

### Logo groottes:
- `size="sm"` - Klein (sidebar, mobile)
- `size="md"` - Medium (auth pagina's)
- `size="lg"` - Groot (hero secties) 