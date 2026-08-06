from PIL import Image

def make_white_transparent(img_path, output_path, threshold=245):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    newData = []
    
    for item in datas:
        # item is (r, g, b, a)
        r, g, b, a = item
        # If the pixel is close to pure white, make it transparent
        if r >= threshold and g >= threshold and b >= threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent logo to {output_path}")

if __name__ == "__main__":
    new_logo_path = "/Users/amro/.gemini/antigravity-ide/brain/75560c3a-9891-43ce-9120-25eaf8c94052/media__1785998001261.png"
    output_path = "/Users/amro/Desktop/Amro's PC/Usend/src/assets/usend-logo.png"
    make_white_transparent(new_logo_path, output_path, threshold=250)
