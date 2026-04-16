# Visibility Radar — SEM Intelligence

Aplicación web para monitoreo de campañas Google Ads y Bing Ads.
Detecta desviaciones de visibilidad (IS, IS Top, IS Abs. Top, Imp. Perdidas Ranking) semana a semana.

## Características

- **Control Semanal Operativo**: Alertas relativas — detecta campañas con caídas en KPIs vs. medias históricas.
- **Salud Estructural de Marca**: Evaluación absoluta de todas las campañas vs. umbrales fijos de branding.
- **Exportación Excel**: Reporte descargable con alertas agrupadas por tipo.
- 100% procesamiento local — los datos no se envían a ningún servidor.

## Tecnologías

- React 18 + Vite
- SheetJS (xlsx) para lectura y exportación de archivos Excel/CSV
- Lucide React (iconos)
- Google Fonts: Syne + JetBrains Mono + Inter

## Formato de archivo esperado

Archivo `.xlsx`, `.xls` o `.csv` (TSV) con las columnas:

| Columna | Descripción |
|---------|-------------|
| `Semana` | Fecha inicio de semana (lunes) |
| `Campaña` | Nombre de campaña |
| `Impr.` | Impresiones |
| `Código de moneda` | EUR / USD |
| `Coste` | Coste total |
| `Cuota de impr. de búsqueda` | IS (%) |
| `Cuota impr. de parte sup. de búsqueda` | IS Top (%) |
| `Cuota impr. parte sup. absoluta de Búsqueda` | IS Abs. Top (%) |
| `Cuota impr. perd. de búsq. (ranking)` | Imp. perdidas ranking (%) |
| ... (columnas adicionales opcionales) | |

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy en Netlify

1. Sube el repositorio a GitHub.
2. Conecta el repo en [app.netlify.com](https://app.netlify.com).
3. Build command: `npm run build`
4. Publish directory: `dist`
5. El archivo `netlify.toml` ya incluye esta configuración automáticamente.

## Lógica de alertas

### Control Semanal Operativo (relativo)
- **Alerta IS Búsqueda**: Última semana cae > 10pp vs. media 8 semanas
- **Alerta IS Abs. Top**: Última semana cae > 15pp vs. media 8 semanas

### Salud Estructural de Marca (absoluto)
- IS Búsqueda < 85%
- IS Parte Superior < 60%
- Imp. Perdidas Ranking > 10%
