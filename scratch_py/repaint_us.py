from PIL import Image

def repaint_us_letters():
    img_path = "/Users/amro/Desktop/Amro's PC/Usend/src/assets/usend-logo.png"
    img = Image.open(img_path)
    img = img.convert("RGBA")
    
    w, h = img.size
    
    # Identify dark pixels in the text region
    pixels = {}
    for y in range(130, 260):
        for x in range(35, 300):
            r, g, b, a = img.getpixel((x, y))
            if a > 50 and r < 70 and g < 70 and b < 70:
                pixels[(x, y)] = True
                
    # Run BFS/DFS to find connected components
    visited = set()
    components = []
    
    for (x, y) in pixels:
        if (x, y) in visited:
            continue
            
        comp = []
        queue = [(x, y)]
        visited.add((x, y))
        
        while queue:
            cx, cy = queue.pop(0)
            comp.append((cx, cy))
            
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    nx, ny = cx + dx, cy + dy
                    if (nx, ny) in pixels and (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
        components.append(comp)
        
    # We want to find the components for 'U' and 'S'
    u_component = None
    s_component = None
    
    for comp in components:
        xs = [p[0] for p in comp]
        min_x = min(xs)
        max_x = max(xs)
        # Bounding boxes:
        # 'U' is around x=(42 to 84)
        if 40 <= min_x <= 45 and len(comp) > 1000:
            u_component = comp
        # 'S' is around x=(86 to 127)
        elif 84 <= min_x <= 90 and len(comp) > 1000:
            s_component = comp
            
    if u_component is None or s_component is None:
        print("Error: Could not identify U or S components!")
        return
        
    # Create editable pixel list
    img_data = list(img.getdata())
    
    # Paint 'U' and 'S' component pixels to white (255, 255, 255, 255)
    for (x, y) in u_component:
        idx = y * w + x
        img_data[idx] = (255, 255, 255, 255)
        
    for (x, y) in s_component:
        idx = y * w + x
        img_data[idx] = (255, 255, 255, 255)
        
    # Save the updated image
    new_img = Image.new("RGBA", (w, h))
    new_img.putdata(img_data)
    new_img.save(img_path, "PNG")
    print(f"Successfully repainted U and S to white in {img_path}!")

if __name__ == "__main__":
    repaint_us_letters()
