from PIL import Image

def find_text_regions():
    img = Image.open("/Users/amro/Desktop/Amro's PC/Usend/src/assets/usend-logo.png")
    w, h = img.size
    
    # Let's print a high res grid of x=(40 to 350) and y=(120 to 320)
    # to find exactly where "USEND" is.
    cols = 80
    rows = 40
    
    x_min, x_max = 40, 320
    y_min, y_max = 120, 320
    
    cell_w = (x_max - x_min) / cols
    cell_h = (y_max - y_min) / rows
    
    grid = []
    for r in range(rows):
        row_str = ""
        y_start = int(y_min + r * cell_h)
        y_end = int(y_min + (r + 1) * cell_h)
        for c in range(cols):
            x_start = int(x_min + c * cell_w)
            x_end = int(x_min + (c + 1) * cell_w)
            
            dark_count = 0
            for y in range(y_start, y_end):
                for x in range(x_start, x_end):
                    if x >= w or y >= h:
                        continue
                    r_val, g_val, b_val, a_val = img.getpixel((x, y))
                    # Check for dark pixels
                    if a_val > 50 and r_val < 65 and g_val < 65 and b_val < 65:
                        dark_count += 1
            
            # If any dark pixels are found, mark it
            if dark_count > 0:
                row_str += "#"
            else:
                row_str += "."
        grid.append(row_str)
        
    print("\n".join(grid))

if __name__ == "__main__":
    find_text_regions()
