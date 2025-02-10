import {
    CfxTexture,
    Mesh,
    OrthographicCamera,
    PlaneBufferGeometry,
    Scene,
    ShaderMaterial,
    WebGLRenderer,
} from "@citizenfx/three"; // bro has no fucking types
import * as Bytescale from "@bytescale/sdk";
import nodeFetch from "node-fetch";
import fixWebmDuration from "fix-webm-duration";
import { useEffect, useRef } from "react";
import { useNuiEvent } from "@/lib/hooks";
const FiveMCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    let renderer: WebGLRenderer;
    let sceneRTT: Scene;
    let cameraRTT: OrthographicCamera;

    let recordStream: MediaStream | null = null;
    let recorder: MediaRecorder;
    let recordData: BlobPart[] = [];
    let recordStartTime = 0;

    const initCamera = () => {
        const camera = new OrthographicCamera(
            window.innerWidth / -2,
            window.innerWidth / 2,
            window.innerHeight / 2,
            window.innerHeight / -2,
            -10000,
            10000,
        );
        camera.position.z = 100;

        const scene = new Scene();

        const gameTexture: any = new CfxTexture();
        gameTexture.needsUpdate = true;

        const material = new ShaderMaterial({
            uniforms: { tDiffuse: { value: gameTexture } },
            vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = vec2(uv.x, uv.y);
                      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                  }`,
            fragmentShader: `
                  varying vec2 vUv;
                  uniform sampler2D tDiffuse;
                  void main() {
                      gl_FragColor = texture2D( tDiffuse, vUv );
                  }`,
        });

        const plane = new PlaneBufferGeometry(
            window.innerWidth,
            window.innerHeight,
        );
        const quad = new Mesh(plane, material);
        quad.position.z = -100;
        scene.add(quad);

        const rendererInstance = new WebGLRenderer({
            canvas: canvasRef.current as HTMLCanvasElement,
            logarithmicDepthBuffer: true,
        });
        rendererInstance.setPixelRatio(window.devicePixelRatio);
        rendererInstance.setSize(window.innerWidth, window.innerHeight);
        rendererInstance.autoClear = false;

        renderer = rendererInstance;
        sceneRTT = scene;
        cameraRTT = camera;
    };

    const animate = () => {
        if (!renderer || !sceneRTT || !cameraRTT) return;
        requestAnimationFrame(animate);
        renderer.clear();
        renderer.render(sceneRTT, cameraRTT);
    };

    const startVideo = async () => {
        recordData = [];

        if (recordStream == null) {
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const canvasStream = canvasRef.current
                ?.captureStream() as MediaStream;
            recordStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioStream.getAudioTracks(),
            ]);
        }

        recorder = new MediaRecorder(recordStream, { mimeType: "video/webm" });
        recorder.ondataavailable = (event) => {
            const data = event.data;
            if (data && data.size > 0) recordData.push(data);
        };

        recorder.start();
        recordStartTime = Date.now();
    };

    const stopVideo = () => {
        recorder.onstop = async () => {
            let blob = new Blob(recordData, { type: "video/webm" });
            blob = await (fixWebmDuration as any)(
                blob,
                Date.now() - recordStartTime,
                {},
            );
            // can be replaced with any uploader or logic.
            const uploadManager = new Bytescale.UploadManager({
                fetchApi: nodeFetch as any,
                apiKey: "", // your api key
            });

            uploadManager
                .upload({
                    data: blob,
                    mime: "video/webm",
                    originalFileName: "video.webm",
                })
                .then(
                    ({ fileUrl }) =>
                        console.log(`File uploaded to: ${fileUrl}`),
                    (error) => console.error(`Error: ${error.message}`, error),
                );
        };

        recorder.stop();
    };

    useNuiEvent("startVideo", startVideo);
    useNuiEvent("stopVideo", stopVideo);

    useEffect(() => {
        initCamera();
        requestAnimationFrame(animate);
    }, []);

    return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default FiveMCanvas;
