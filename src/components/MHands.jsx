import { useRef, useEffect } from "react";
import Webcam from "react-webcam";
// import { Hands } from "@mediapipe/hands";
// import { Camera } from "@mediapipe/camera_utils";
// import { LandmarkGrid } from "@mediapipe/control_utils_3d";
// import {
//   drawConnectors,
//   drawLandmarks,
//   HAND_CONNECTIONS,
// } from "@mediapipe/drawing_utils";
import styled from "@emotion/styled";
import useStore from "../store/store";
import ThemeOptions from "../theme";
import {send} from "../sender"

const labels = [
  "wrist",
  "thumb_cmc",
  "thumb_mcp",
  "thumb_ip",
  "thumb_tip",
  "index_finger_mcp",
  "index_finger_pip",
  "index_finger_dip",
  "index_finger_tip",
  "middle_finger_mcp",
  "middle_finger_pip",
  "middle_finger_dip",
  "middle_finger_tip",
  "ring_finger_mcp",
  "ring_finger_pip",
  "ring_finger_dip",
  "ring_finger_tip",
  "pinky_mcp",
  "pinky_pip",
  "pinky_dip",
  "pinky_tip",
];

const WebcamContainer = styled.div`
  display: none;
`;

const Overlay = styled.canvas`
  width: 640px;
  height: 480px;
`;

function MHands() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const videoDeviceId = useStore((state) => state.videoDeviceId);
  const activeHandLandmarkPoints = useStore(
    (state) => state.activeHandLandmarkPoints
  );
  const allHandLandmarkPointsAsJson = useStore(
    (state) => state.allHandLandmarkPointsAsJson
  );
  useEffect(() => {
    const canvasCtx = canvasRef.current.getContext("2d");
    function onResults(results) {
      if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
          if (allHandLandmarkPointsAsJson) {
            send("hands/${index}/all", [JSON.stringify(landmarks)] )
          }
          labels.forEach((label) => {
            if (activeHandLandmarkPoints.includes(label)) {
              window.api?.send("sendMessage", {
                address: `hands/${index}/${label}`,
                args: [landmarks[index]],
              });
            }
          });
        });
      }

      canvasCtx.save();
      canvasCtx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: ThemeOptions.palette.primary.main,
            lineWidth: 5,
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: ThemeOptions.palette.secondary.main,
            lineWidth: 2,
          });
        }
      }
      canvasCtx.restore();
    }
    const hands = new Hands({
      locateFile: (file) => {
        return window.api ? `static://models/hands/${file}` : `models/hands/${file}` ;
      },
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onResults);

    const camera = new Camera(webcamRef.current.video, {
      onFrame: async () => {
        if (webcamRef.current?.video) {
          await hands.send({ image: webcamRef.current.video });
        }
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, []);
  return (
    <div className="hands">
      <WebcamContainer>
        <Webcam
          ref={webcamRef}
          width="640px"
          height="480px"
          videoConstraints={videoDeviceId ? { deviceId: videoDeviceId } : {}}
        ></Webcam>
      </WebcamContainer>
      <Overlay ref={canvasRef} className="output_canvas"></Overlay>
    </div>
  );
}

export default MHands;
export { labels as landmarkPoints };
