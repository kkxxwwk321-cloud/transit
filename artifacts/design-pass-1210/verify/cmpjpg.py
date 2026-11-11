import sys,os
from PIL import Image,ImageDraw,ImageFont
# usage: cmpjpg.py out.jpg scale label1=path1 label2=path2 ...
out,scale,*items=sys.argv[1:];scale=float(scale)
try: font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',22)
except Exception: font=None
ims=[]
for it in items:
    lab,p=it.split('=',1);ims.append((lab,Image.open(p).convert('RGB')))
# normalise: every panel gets the same height (scale applied to the tallest), so mixed DPR captures line up
th=int(max(i.height for _,i in ims)*scale);ims=[(l,i.resize((max(1,round(i.width*th/i.height)),th))) for l,i in ims]
w=max(i.width for _,i in ims);h=max(i.height for _,i in ims)
sheet=Image.new('RGB',(w*len(ims)+8*(len(ims)-1),h+36),'white');d=ImageDraw.Draw(sheet)
for k,(lab,im) in enumerate(ims):
    x=k*(w+8);sheet.paste(im,(x,36));d.text((x+6,6),lab,fill=(30,40,45),font=font)
sheet.save(out,quality=86);print(out,sheet.size)
