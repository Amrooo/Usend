from PIL import Image
from collections import Counter

def list_frequent_colors():
    img = Image.open("/Users/amro/Desktop/Amro's PC/Usend/src/assets/usend-logo.png")
    w, h = img.size
    
    colors = []
    # Sample every 2nd pixel to make it fast
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b, a = img.getpixel((x, y))
            if a > 30: # Only count non-transparent
                # Round to nearest 10 for grouping
                r_r = round(r / 10) * 10
                g_r = round(g / 10) * 10
                b_r = round(b / 10) * 10
                colors.append((r_r, g_r, b_r))
                
    counter = Counter(colors)
    print("Most common colors:")
    for color, count in counter.most_common(20):
        print(f"Color {color}: {count} pixels")

if __name__ == "__main__":
    list_frequent_colors()
