from PIL import Image

def analyze_black_pixels():
    img = Image.open("/Users/amro/Desktop/Amro's PC/Usend/src/assets/usend-logo.png")
    w, h = img.size
    print(f"Dimensions: {w}x{h}")
    
    # We want to find dark pixels (text is black/dark charcoal)
    dark_pixels = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            if a > 50 and r < 60 and g < 60 and b < 60:
                dark_pixels.append((x, y))
                
    if not dark_pixels:
        print("No dark pixels found!")
        return
        
    xs = [p[0] for p in dark_pixels]
    ys = [p[1] for p in dark_pixels]
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    print(f"Dark pixels bounding box: x=({min_x} to {max_x}), y=({min_y} to {max_y})")

if __name__ == "__main__":
    analyze_black_pixels()
