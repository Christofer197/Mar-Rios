#!/usr/bin/env python3
"""
Generador de Iconos PWA
Genera todos los tamaños de iconos necesarios desde logo_turismo.png
"""

import os
from PIL import Image

# Configuración
INPUT_IMAGE = 'logo_turismo.png'
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def generate_icons():
    """Genera iconos en diferentes tamaños"""
    
    # Verificar que existe el logo
    if not os.path.exists(INPUT_IMAGE):
        print(f"❌ Error: No se encontró {INPUT_IMAGE}")
        print("   Asegúrate de que el archivo esté en la misma carpeta")
        return False
    
    print(f"📸 Procesando {INPUT_IMAGE}...")
    
    try:
        # Abrir imagen original
        img = Image.open(INPUT_IMAGE)
        
        # Convertir a RGBA si es necesario
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        print(f"✅ Imagen cargada: {img.size[0]}x{img.size[1]}px")
        print()
        
        # Generar cada tamaño
        for size in SIZES:
            output_file = f'icon-{size}.png'
            
            # Redimensionar
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # Guardar
            resized.save(output_file, 'PNG', optimize=True)
            
            # Mostrar tamaño del archivo
            file_size = os.path.getsize(output_file) / 1024
            print(f"✅ Creado: {output_file} ({file_size:.1f}KB)")
        
        print()
        print("🎉 ¡Todos los iconos generados exitosamente!")
        print()
        print("📝 Iconos creados:")
        for size in SIZES:
            print(f"   - icon-{size}.png")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al procesar imagen: {e}")
        return False

def check_dependencies():
    """Verificar que Pillow esté instalado"""
    try:
        import PIL
        return True
    except ImportError:
        print("❌ Error: Pillow no está instalado")
        print()
        print("Para instalar, ejecuta:")
        print("   pip install Pillow")
        print()
        print("O en algunos sistemas:")
        print("   pip3 install Pillow")
        return False

if __name__ == '__main__':
    print()
    print("=" * 50)
    print("  GENERADOR DE ICONOS PWA")
    print("  Mar y Rios Pacifico")
    print("=" * 50)
    print()
    
    if check_dependencies():
        generate_icons()
    
    print()
    input("Presiona Enter para salir...")
