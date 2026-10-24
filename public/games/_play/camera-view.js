// Camera streams already carry browser orientation. Do not mirror remote faces.
export function cameraTurn(value){const n=Number(value);return Number.isFinite(n)?((Math.round(n/90)*90)%360+360)%360:0;}
export function readCameraTurn(key){try{return cameraTurn(localStorage.getItem('joynot-camera-turn:'+key));}catch{return 0;}}
export function saveCameraTurn(key,turn){try{localStorage.setItem('joynot-camera-turn:'+key,String(cameraTurn(turn)));}catch{}}
export function applyCameraTurn(element,turn,self=false){if(!element)return;const angle=cameraTurn(turn);element.style.transform=`rotate(${angle}deg)${self?' scaleX(-1)':''}`;element.style.objectFit=angle%180?'contain':'cover';element.dataset.cameraTurn=String(angle);}
