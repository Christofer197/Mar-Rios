#!/bin/bash

# Generador de Iconos PWA con ImageMagick
# Para usar: chmod +x generar_iconos.sh && ./generar_iconos.sh

echo ""
echo "=================================================="
echo "  GENERADOR DE ICONOS PWA"
echo "  Mar y Rios Pacifico"
echo "=================================================="
echo ""

# Verificar que ImageMagick esté instalado
if ! command -v convert &> /dev/null && ! command -v magick &> /dev/null; then
    echo "❌ Error: ImageMagick no está instalado"
    echo ""
    echo "Para instalar:"
    echo "  Ubuntu/Debian: sudo apt install imagemagick"
    echo "  Mac: brew install imagemagick"
    echo "  Windows: Descarga desde https://imagemagick.org"
    echo ""
    exit 1
fi

# Archivo de entrada
INPUT="logo_turismo.png"

# Verificar que existe el logo
if [ ! -f "$INPUT" ]; then
    echo "❌ Error: No se encontró $INPUT"
    echo "   Asegúrate de que el archivo esté en la misma carpeta"
    echo ""
    exit 1
fi

echo "📸 Procesando $INPUT..."
echo ""

# Tamaños a generar
SIZES=(72 96 128 144 152 192 384 512)

# Generar cada tamaño
for SIZE in "${SIZES[@]}"; do
    OUTPUT="icon-${SIZE}.png"
    
    # Usar convert o magick según la versión
    if command -v magick &> /dev/null; then
        magick "$INPUT" -resize ${SIZE}x${SIZE} "$OUTPUT"
    else
        convert "$INPUT" -resize ${SIZE}x${SIZE} "$OUTPUT"
    fi
    
    # Verificar que se creó
    if [ -f "$OUTPUT" ]; then
        FILE_SIZE=$(du -h "$OUTPUT" | cut -f1)
        echo "✅ Creado: $OUTPUT ($FILE_SIZE)"
    else
        echo "❌ Error al crear: $OUTPUT"
    fi
done

echo ""
echo "🎉 ¡Todos los iconos generados exitosamente!"
echo ""
echo "📝 Iconos creados:"
for SIZE in "${SIZES[@]}"; do
    echo "   - icon-${SIZE}.png"
done
echo ""
