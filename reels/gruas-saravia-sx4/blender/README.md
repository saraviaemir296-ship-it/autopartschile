# Logo 3D Grúas Saravia (Blender / Cycles)

Render 3D real del logo: los contornos se extraen del logo original (`logo_polys.json`),
se extruyen con bisel y se iluminan en un estudio negro con softboxes, contraluces rojos,
una tira de luz que barre y piso reflectante.

    pip install bpy   # Blender como módulo de Python (en un venv aparte: requiere numpy<2)
    python scene.py logo_polys.json frames 100 40 all      # 192 cuadros, 24 fps, 1080x1920
    python scene.py logo_polys.json test 50 32 15,190      # cuadros sueltos de prueba
