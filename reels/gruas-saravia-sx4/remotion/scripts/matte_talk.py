import subprocess, numpy as np, mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
from scipy.ndimage import gaussian_filter, binary_erosion
W,H=1080,1920; SRC='/home/user/autopartschile/reels/gruas-saravia-sx4/remotion/public/compra/talk.mp4'
OUT='/home/user/autopartschile/reels/gruas-saravia-sx4/remotion/public/compra/talk_cutout.webm'
rd=subprocess.Popen(['ffmpeg','-loglevel','error','-ss','0.8','-i',SRC,'-frames:v','412','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
wr=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s',f'{W}x{H}','-r','30','-i','-','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-b:v','6M','-deadline','good','-cpu-used','4','-row-mt','1',OUT],stdin=subprocess.PIPE)
seg=vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=mpt.BaseOptions(model_asset_path='selfie_multiclass.tflite'),running_mode=vision.RunningMode.VIDEO,output_confidence_masks=True))
prev=None; n=0
while True:
    b=rd.stdout.read(W*H*3)
    if len(b)<W*H*3: break
    fr=np.frombuffer(b,np.uint8).reshape(H,W,3)
    r=seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.ascontiguousarray(fr)),int(n*1000/30))
    m=1-np.squeeze(r.confidence_masks[0].numpy_view()).astype(np.float32)
    m=np.clip((m-0.35)/0.35,0,1)
    m=prev*0.35+m*0.65 if prev is not None else m
    prev=m
    hard=binary_erosion(m>0.5,iterations=2)
    a=gaussian_filter(np.where(hard,1.0,m*0.6),1.6)
    a=np.clip(a,0,1)
    rgba=np.dstack([fr,(a*255).astype(np.uint8)])
    wr.stdin.write(rgba.tobytes()); n+=1
wr.stdin.close(); wr.wait(); print('frames',n)
