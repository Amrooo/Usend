from PIL import Image

def find_connected_components():
    img = Image.open("/Users/amro/Desktop/Amro's PC/Usend/src/assets/usend-logo.png")
    w, h = img.size
    
    # We focus on the text region on the box
    # x in [35, 300], y in [130, 260]
    # Let's collect all dark pixels in this region
    pixels = {}
    for y in range(130, 260):
        for x in range(35, 300):
            r, g, b, a = img.getpixel((x, y))
            if a > 50 and r < 70 and g < 70 and b < 70:
                pixels[(x, y)] = True
                
    # Now run BFS to find connected components
    visited = set()
    components = []
    
    for (x, y) in pixels:
        if (x, y) in visited:
            continue
            
        # Start new component
        comp = []
        queue = [(x, y)]
        visited.add((x, y))
        
        while queue:
            cx, cy = queue.pop(0)
            comp.append((cx, cy))
            
            # Check neighbors (8-connectivity)
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    nx, ny = cx + dx, cy + dy
                    if (nx, ny) in pixels and (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
        components.append(comp)
        
    print(f"Found {len(components)} connected components of dark pixels in text region.")
    
    # Sort components by size (number of pixels) descending
    components.sort(key=len, reverse=True)
    
    # Print bounding box of the top 10 largest components
    for idx, comp in enumerate(components[:15]):
        xs = [p[0] for p in comp]
        ys = [p[1] for p in comp]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        print(f"Comp {idx+1}: size={len(comp)}, x=({min_x} to {max_x}), y=({min_y} to {max_y})")

if __name__ == "__main__":
    find_connected_components()
