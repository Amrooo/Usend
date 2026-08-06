from PIL import Image

def visualize_dark_pixels():
    img = Image.open("/Users/amro/Desktop/Amro's PC/Usend/src/assets/usend-logo.png")
    w, h = img.size
    
    # We'll map the image to a grid of 60 columns and 30 rows
    cols = 80
    rows = 40
    
    cell_w = w / cols
    cell_h = h / rows
    
    grid = []
    for r in range(rows):
        row_str = ""
        y_start = int(r * cell_h)
        y_end = int((r + 1) * cell_h)
        for c in range(cols):
            x_start = int(c * cell_w)
            x_end = int((c + 1) * cell_w)
            
            # Count dark pixels in this cell
            dark_count = 0
            total_count = 0
            for y in range(y_start, min(y_end, h)):
                for x in range(x_start, min(x_end, w)):
                    r_val, g_val, b_val, a_val = img.getpixel((x, y))
                    if a_val > 50 and r_val < 65 and g_val < 65 and b_val < 65:
                        dark_count += 1
                    total_count += 1
            
            # If more than 15% of pixels are dark, mark it
            if total_count > 0 and (dark_count / total_count) > 0.15:
                row_str += "#"
            else:
                row_str += "."
        grid.append(row_str)
        
    print("\n".join(grid))

if __name__ == "__main__":
    visualize_dark_pixels()
