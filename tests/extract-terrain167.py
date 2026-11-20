"""Extract conservative gameplay boundaries from final painted terrain (read-only image analysis)."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import contourpy
root=Path(__file__).resolve().parent.parent
assets={'east':'15eff5ba-44fe-4bd0-9734-7a3105924024','west':'c4abe3aa-1a34-4cba-b01e-c1961cd02c4f','ocean':'7f39da36-2221-44e9-a15d-f1299d370ae8'}
bounds={'east':[-1000,-300,1200,1200],'west':[-1300,-450,1500,1650],'ocean':[-240,0,3900,3900]}
def simplify(p,eps=1.2):
 if len(p)<4:return p
 a,b=p[0],p[-1];v=b-a;d=np.abs(np.cross(v,p-a))/max(np.linalg.norm(v),1e-8);i=int(np.argmax(d))
 if d[i]<=eps:return p[[0,-1]]
 return np.concatenate([simplify(p[:i+1],eps)[:-1],simplify(p[i:],eps)])
def polys(mask,minarea=50,eps=1.0):
 labels,n=ndi.label(mask);out=[]
 for i in range(1,n+1):
  one=labels==i
  if one.sum()<minarea:continue
  a=np.pad(ndi.binary_fill_holes(one).astype(float),1)
  lines=contourpy.contour_generator(z=a).lines(.5)
  if not lines:continue
  p=max(lines,key=len)-1;cut=len(p)//2;p=np.concatenate([simplify(p[:cut+1],eps)[:-1],simplify(p[cut:],eps)])
  if len(p)>4:out.append(p.tolist())
 return out
result={}
for key,uid in assets.items():
 dest=root/'dist/terrain167'/f'{key}.png'
 src=Path(sys.argv[1])/('exec-'+uid+'.png') if len(sys.argv)>1 else dest
 if src.resolve()!=dest.resolve():dest.write_bytes(src.read_bytes())
 image=Image.open(src).convert('RGB');w=800;h=round(image.height*w/image.width);rgb=np.array(image.resize((w,h))).astype(float);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
 # Blue/cyan freshwater and ocean; green/ochre ground and neutral rock are excluded.
 water=(b>r+7)&(g>r+5)&(b>g*.86)
 rawWater=water.copy();water=ndi.binary_closing(water,iterations=2)
 water[:2,:]=rawWater[:2,:];water[-2:,:]=rawWater[-2:,:];water[:,:2]=rawWater[:,:2];water[:,-2:]=rawWater[:,-2:]
 coast=[];islands=[]
 if key=='ocean':
  ground=ndi.binary_closing(np.pad(~water,14,mode='edge'),iterations=7)[14:-14,14:-14]
  lab,n=ndi.label(ground);counts=np.bincount(lab.ravel());counts[0]=0;main=lab==counts.argmax();main=ndi.binary_fill_holes(main)
  main[:2,:]=True # north is continuous mainland, never a northern beach
  allpoly=polys(main,100,1.1);coast=max(allpoly,key=len)
  # Split at the two top corners so nearestShore's open chain excludes the north.
  arr=np.array(coast);top=arr[:,1]<1;inds=np.flatnonzero(top);left=inds[np.argmin(arr[inds,0])];right=inds[np.argmax(arr[inds,0])]
  path1=[];i=left
  while True:
   path1.append(arr[i].tolist())
   if i==right:break
   i=(i+1)%len(arr)
  path2=[];i=left
  while True:
   path2.append(arr[i].tolist())
   if i==right:break
   i=(i-1)%len(arr)
  coast=max([path1,path2],key=lambda p:max(x[1] for x in p));coast[0][1]=coast[-1][1]=0
  # Smaller painted land masses also block ship paths.
  islandmask=(~water)&(~ndi.binary_dilation(main,iterations=3));islands=polys(islandmask,45,1.0)
  fresh=water&main
 else:fresh=water
 # Restrict ambiguous blue-gray rock shadows to reviewed river corridors.
 yy,xx=np.mgrid[0:h,0:w];fx=xx/w;fy=yy/h
 paths={'east':[[[.21,0],[.28,.13],[.31,.24],[.39,.30],[.42,.45],[.39,.53],[.4,.64],[.36,.73],[.36,.83],[.42,.95],[.48,1]],[[1,.02],[.86,.11],[.75,.18],[.59,.22],[.5,.26],[.39,.30]],[[1,.42],[.88,.48],[.8,.55],[.65,.58],[.51,.57],[.4,.64]],[[0,.96],[.12,.91],[.2,.83],[.3,.81],[.37,.74]]],'west':[[[.2,0],[.17,.15],[.20,.30],[.27,.40],[.40,.47],[.45,.56],[.56,.63],[.61,.72],[.75,.78],[.9,.9],[1,.96]],[[.6,0],[.67,.12],[.73,.17],[.70,.29],[.64,.42],[.52,.48],[.46,.55]],[[0,.38],[.13,.42],[.26,.44],[.33,.46],[.4,.47]]],'ocean':[[[.39,.19],[.48,.27],[.49,.4],[.45,.46],[.5,.5],[.44,.57],[.49,.62],[.48,.71],[.51,.76],[.5,.82],[.4,.83]]]}[key]
 corridor=np.zeros_like(fresh)
 for path in paths:
  for (ax,ay),(bx,by) in zip(path,path[1:]):
   dx=bx-ax;dy=by-ay;t=np.clip(((fx-ax)*dx+(fy-ay)*dy)/(dx*dx+dy*dy),0,1);corridor|=((fx-ax-t*dx)**2+(fy-ay-t*dy)**2)<(.09 if key!='ocean' else .07)**2
 if key=='ocean':corridor|=(fx>.61)&(fy<.29)
 fresh&=corridor
 fresh=ndi.binary_closing(fresh,iterations=5)
 fresh=ndi.binary_opening(fresh,iterations=1)
 waters=polys(fresh,20,.7)
 yy,xx=np.mgrid[0:h,0:w];x=xx/w;y=yy/h
 rock=(r>g*.90)&((g-b)<48)&((r-b)>10)&(r>65)&(b>45)
 if key=='east':rock[:]=False
 if key=='ocean':rock&=(x<.44)&(y<.88)&((x>.06)|(y<.5))
 rock=ndi.binary_opening(rock,iterations=1);rock=ndi.binary_closing(rock,iterations=4);rock=ndi.binary_dilation(rock,iterations=4);rock&=~ndi.binary_dilation(fresh,iterations=3)
 mountains=[]
 # Partition only collision polygons, never the image: preserve the open basin inside a connected mountain ring.
 for gy in range(4):
  for gx in range(4):
   tile=rock.copy();tile[:gy*h//4,:]=False;tile[(gy+1)*h//4:,:]=False;tile[:,:gx*w//4]=False;tile[:,(gx+1)*w//4:]=False;mountains+=polys(tile,65,1.1)
 x0,y0,x1,y1=bounds[key]
 def world(ps):return [[[round(x0+a/w*(x1-x0),2),round(y0+c/h*(y1-y0),2)]for a,c in p]for p in ps]
 mainline=[]
 if key!='ocean':
  for row in range(0,h,8):
   ids=np.flatnonzero(fresh[row]);groups=np.split(ids,np.flatnonzero(np.diff(ids)>1)+1) if len(ids) else []
   if groups:
    group=max(groups,key=len);mainline.append([float(group.mean()),row])
 result[key]={'main':world([mainline])[0] if mainline else [],'bounds':{'xmin':x0,'ymin':y0,'xmax':x1,'ymax':y1},'water':world(waters),'mountains':world(mountains),'coast':world([coast])[0] if coast else [],'islands':world(islands),'sourceSize':[image.width,image.height]}
 print(key,'water',len(waters),'mountains',len(mountains),'coast',len(coast),'islands',len(islands))
(root/'dist/terrain167-data.js').write_text('const TERRAIN167='+json.dumps(result,separators=(',',':'))+';\n')
