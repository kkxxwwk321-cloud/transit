import json,numpy as np
from PIL import Image
from pathlib import Path
import sys
m=json.load(open(sys.argv[1] if len(sys.argv)>1 else Path(__file__).with_name('ocean-raster166.json')));b=m['bounds'];step=2
x,y=np.meshgrid(np.arange(b['xmin'],b['xmax'],step,dtype=float),np.arange(b['ymin'],b['ymax'],step,dtype=float))
def noise(x,y):
 ix=np.floor(x);iy=np.floor(y);fx=x-ix;fy=y-iy;sx=fx*fx*(3-2*fx);sy=fy*fy*(3-2*fy)
 def h(a,b):
  v=np.sin(a*127.1+b*311.7)*43758.5453;return v-np.floor(v)
 a=h(ix,iy);bb=h(ix+1,iy);c=h(ix,iy+1);d=h(ix+1,iy+1)
 return (a+(bb-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy
hill=np.zeros_like(x);mount=np.zeros_like(x)
for e in m['hills']:
 dx=(x-e['x']-32*np.sin(y/95))/e['rx'];dy=(y-e['y'])/e['ry'];hill+=np.exp(-(dx*dx*.72+dy*dy*1.2))*30
for e in m['mountains']:
 dx=(x-e['x']-44*np.sin(y/100))/(e['rx']*1.2);dy=(y-e['y'])/e['ry'];mount+=np.exp(-(dx*dx*.9+dy*dy))*150
z=hill*(.8+noise(x/240,y/240)*.15)+mount*(.65+noise(x/240,y/240)*.12)
dy,dx=np.gradient(z,step);shade=np.clip((-dx*.8-dy*.6)*.65,-.28,.27);n=noise(x/130,y/130)*.65+noise(x/34,y/34)*.25+noise(x/5,y/5)*.1
des=np.clip(np.where(x<1500,(y-1950)/550,0),0,1)*np.clip((1700-x)/500,0,1);rock=np.clip((z-105)/130,0,.85)
rgb=np.zeros((*x.shape,3),dtype=np.uint8)
for ch in range(3):
 color=[222,230,194][ch]*(1-des)+[233,214,170][ch]*des;color=color*(1-rock)+[173,179,151][ch]*rock;rgb[:,:,ch]=np.clip(color+shade*95+(n-.5)*14,0,255)
Image.fromarray(rgb).save(str(Path(__file__).resolve().parent.parent/'dist/ocean-base166.png'),optimize=True)
