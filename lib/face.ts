const MODELS = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
let api: typeof import("@vladmandic/face-api") | null = null;
export async function loadFace() {
  if (api) return api;
  const f = await import("@vladmandic/face-api");
  await Promise.all([f.nets.tinyFaceDetector.loadFromUri(MODELS), f.nets.faceLandmark68Net.loadFromUri(MODELS), f.nets.faceRecognitionNet.loadFromUri(MODELS)]);
  api = f; return f;
}
export async function startCam(v: HTMLVideoElement, facing: "user" | "environment" = "user") {
  (v.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
  v.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } } });
  await v.play();
}
export async function getDescriptor(v: HTMLVideoElement): Promise<number[] | null> {
  const f = await loadFace();
  const r = await f.detectSingleFace(v, new f.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
  return r ? Array.from(r.descriptor) : null;
}
export const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
export const MATCH = 0.5;
