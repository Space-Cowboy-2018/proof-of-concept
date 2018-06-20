import React from 'react';
import { View, Text, Button } from 'react-native';
import { AR, Asset, Location, Permissions } from 'expo';
// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
import ExpoTHREE, { AR as ThreeAR, THREE } from 'expo-three';
// Let's also import `expo-graphics`
// expo-graphics manages the setup/teardown of the gl context/ar session, creates a frame-loop, and observes size/orientation changes.
// it also provides debug information with `isArCameraStateEnabled`
import { View as GraphicsView, ARRunningState } from 'expo-graphics';
// import { _throwIfAudioIsDisabled } from 'expo/src/av/Audio';

import io from 'socket.io-client';

const host = 'http://172.16.27.121:3030';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io(host);
  }
  componentDidMount() {
    // Turn off extra warnings
    THREE.suppressExpoWarnings(true);
    ThreeAR.suppressWarnings();
  }

  render() {
    // You need to add the `isArEnabled` & `arTrackingConfiguration` props.
    // `isArRunningStateEnabled` Will show us the play/pause button in the corner.
    // `isArCameraStateEnabled` Will render the camera tracking information on the screen.
    // `arTrackingConfiguration` denotes which camera the AR Session will use.
    // World for rear, Face for front (iPhone X only)
    return (
      <View style={{ flex: 1 }}>
        <GraphicsView
          style={{ flex: 5 }}
          onContextCreate={this.onContextCreate}
          onRender={this.onRender}
          onResize={this.onResize}
          isArEnabled
          // isArRunningStateEnabled
          isArCameraStateEnabled
          arTrackingConfiguration={AR.TrackingConfigurations.World}
        />
        <View style={{ flex: 1 }}>
          <Button
            style={{ border: '1px solid black', zIndex: 1000 }}
            title="shoot"
            onPress={this.showPosition}
          />
        </View>
      </View>
    );
  }

  // When our context is built we can start coding 3D things.
  onContextCreate = async ({ gl, scale: pixelRatio, width, height }) => {
    // This will allow ARKit to collect Horizontal surfaces
    AR.setPlaneDetection(AR.PlaneDetectionTypes.Horizontal);

    // Create a 3D renderer
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio,
      width,
      height
    });

    // We will add all of our meshes to this scene.
    this.scene = new THREE.Scene();
    // This will create a camera texture and use it as the background for our scene
    this.scene.background = new ThreeAR.BackgroundTexture(this.renderer);
    // Now we make a camera that matches the device orientation.
    // Ex: When we look down this camera will rotate to look down too!
    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);

    // Make a cube - notice that each unit is 1 meter in real life, we will make our box 0.1 meters
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // Simple color material
    const material = new THREE.MeshPhongMaterial({
      color: 0xff00ff
    });

    // Combine our geometry and material
    this.cube = new THREE.Mesh(geometry, material);
    // Place the box 0.4 meters in front of us.
    this.cube.position.z = -0.4;
    // Add the cube to the scene
    this.scene.add(this.cube);

    // Setup a light so we can see the cube color
    // AmbientLight colors all things in the scene equally.
    this.scene.add(new THREE.AmbientLight(0xffffff));

    // Create this cool utility function that let's us see all the raw data points.
    this.points = new ThreeAR.Points();
    // Add the points to our scene...
    this.scene.add(this.points);
  };

  // When the phone rotates, or the view changes size, this method will be called.
  onResize = ({ x, y, scale, width, height }) => {
    // Let's stop the function if we haven't setup our scene yet
    if (!this.renderer) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  // Called every frame.
  onRender = async () => {
    // This will make the points get more rawDataPoints from Expo.AR
    this.points.update();
    // Finally render the scene with the AR Camera
    this.cube.rotation.x += 0.07;
    this.cube.rotation.y += 0.04;
    this.renderer.render(this.scene, this.camera);
  };

  showPosition = () => {
    let target = new THREE.Vector3();
    this.camera.getWorldPosition(target);
    console.log('emitting', target);
    this.socket.emit('position', target);
    console.log('=======================');
  };
}
