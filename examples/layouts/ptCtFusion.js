import vtkConstants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';
import { CONSTANTS, imageCache } from './../../src/index';
import { SCENE_IDS, VIEWPORT_IDS } from '../constants';
import {
  setCTWWWC,
  setPetTransferFunction,
  getSetPetColorMapTransferFunction,
} from '../helpers/transferFunctionHelpers';

const { ORIENTATION, VIEWPORT_TYPE } = CONSTANTS;
const { BlendMode } = vtkConstants;

function setLayout(
  renderingEngine,
  canvasContainers,
  {
    ctSceneToolGroup,
    ptSceneToolGroup,
    fusionSceneToolGroup,
    ptMipSceneToolGroup,
  },
  {
    axialSynchronizers = [],
    sagittalSynchronizers = [],
    coronalSynchronizers = [],
    ptThresholdSynchronizer,
    ctWLSynchronizer,
  }
) {
  const viewportInput = [
    // CT
    {
      sceneUID: SCENE_IDS.CT,
      viewportUID: VIEWPORT_IDS.CT.AXIAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(0),
      defaultOptions: {
        orientation: ORIENTATION.AXIAL,
      },
    },
    {
      sceneUID: SCENE_IDS.CT,
      viewportUID: VIEWPORT_IDS.CT.SAGITTAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(1),
      defaultOptions: {
        orientation: ORIENTATION.SAGITTAL,
      },
    },
    {
      sceneUID: SCENE_IDS.CT,
      viewportUID: VIEWPORT_IDS.CT.CORONAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(2),
      defaultOptions: {
        orientation: ORIENTATION.CORONAL,
      },
    },

    // PT

    {
      sceneUID: SCENE_IDS.PT,
      viewportUID: VIEWPORT_IDS.PT.AXIAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(3),
      defaultOptions: {
        orientation: ORIENTATION.AXIAL,
        background: [1, 1, 1],
      },
    },
    {
      sceneUID: SCENE_IDS.PT,
      viewportUID: VIEWPORT_IDS.PT.SAGITTAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(4),
      defaultOptions: {
        orientation: ORIENTATION.SAGITTAL,
        background: [1, 1, 1],
      },
    },
    {
      sceneUID: SCENE_IDS.PT,
      viewportUID: VIEWPORT_IDS.PT.CORONAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(5),
      defaultOptions: {
        orientation: ORIENTATION.CORONAL,
        background: [1, 1, 1],
      },
    },

    // Fusion

    {
      sceneUID: SCENE_IDS.FUSION,
      viewportUID: VIEWPORT_IDS.FUSION.AXIAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(6),
      defaultOptions: {
        orientation: ORIENTATION.AXIAL,
      },
    },
    {
      sceneUID: SCENE_IDS.FUSION,
      viewportUID: VIEWPORT_IDS.FUSION.SAGITTAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(7),
      defaultOptions: {
        orientation: ORIENTATION.SAGITTAL,
      },
    },
    {
      sceneUID: SCENE_IDS.FUSION,
      viewportUID: VIEWPORT_IDS.FUSION.CORONAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(8),
      defaultOptions: {
        orientation: ORIENTATION.CORONAL,
      },
    },

    // PET MIP
    {
      sceneUID: SCENE_IDS.PTMIP,
      viewportUID: VIEWPORT_IDS.PTMIP.CORONAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.get(9),
      defaultOptions: {
        orientation: ORIENTATION.CORONAL,
        background: [1, 1, 1],
      },
    },
  ];

  renderingEngine.setViewports(viewportInput);

  // Add tools
  const renderingEngineUID = renderingEngine.uid;

  viewportInput.forEach(viewportInputEntry => {
    const { sceneUID, viewportUID } = viewportInputEntry;

    if (sceneUID === SCENE_IDS.CT) {
      ctSceneToolGroup.addViewports(renderingEngineUID, sceneUID, viewportUID);
    } else if (sceneUID === SCENE_IDS.PT) {
      ptSceneToolGroup.addViewports(renderingEngineUID, sceneUID, viewportUID);
    } else if (sceneUID === SCENE_IDS.FUSION) {
      fusionSceneToolGroup.addViewports(
        renderingEngineUID,
        sceneUID,
        viewportUID
      );
    } else if (sceneUID === SCENE_IDS.PTMIP) {
      ptMipSceneToolGroup.addViewports(
        renderingEngineUID,
        sceneUID,
        viewportUID
      );
    }
  });

  const axialViewports = [0, 3, 6];
  axialSynchronizers.forEach(sync => {
    axialViewports.forEach(axialIndex => {
      const { sceneUID, viewportUID } = viewportInput[axialIndex];
      sync.add({ renderingEngineUID, sceneUID, viewportUID });
    });
  });

  const sagittalViewports = [1, 4, 7];
  sagittalSynchronizers.forEach(sync => {
    sagittalViewports.forEach(sagittalIndex => {
      const { sceneUID, viewportUID } = viewportInput[sagittalIndex];
      sync.add({ renderingEngineUID, sceneUID, viewportUID });
    });
  });

  const coronalViewports = [2, 5, 8];
  coronalSynchronizers.forEach(sync => {
    coronalViewports.forEach(coronalIndex => {
      const { sceneUID, viewportUID } = viewportInput[coronalIndex];
      sync.add({ renderingEngineUID, sceneUID, viewportUID });
    });
  });

  const ctViewports = [0, 1, 2];
  const petViewports = [3, 4, 5];
  const fusionViewports = [6, 7, 8];
  const petMipViewports = [9];

  // CT WL Synchronization
  ctViewports.forEach(ctIndex => {
    const { sceneUID, viewportUID } = viewportInput[ctIndex];
    ctWLSynchronizer.addSource({ renderingEngineUID, sceneUID, viewportUID });
  });

  fusionViewports.forEach(fusionIndex => {
    const { sceneUID, viewportUID } = viewportInput[fusionIndex];
    ctWLSynchronizer.addTarget({ renderingEngineUID, sceneUID, viewportUID });
  });

  // PT Threshold Synchronization
  petViewports.forEach(ptIndex => {
    const { sceneUID, viewportUID } = viewportInput[ptIndex];
    ptThresholdSynchronizer.addSource({ renderingEngineUID, sceneUID, viewportUID });
  });

  fusionViewports.forEach(fusionIndex => {
    const { sceneUID, viewportUID } = viewportInput[fusionIndex];
    ptThresholdSynchronizer.addTarget({ renderingEngineUID, sceneUID, viewportUID });
  });

  petMipViewports.forEach(ptMipIndex => {
    const { sceneUID, viewportUID } = viewportInput[ptMipIndex];
    ptThresholdSynchronizer.addTarget({ renderingEngineUID, sceneUID, viewportUID });
  });

  console.group(ctWLSynchronizer);
  console.group(ptThresholdSynchronizer);

  // Render backgrounds
  renderingEngine.render();
}

function setVolumes(renderingEngine, ctVolumeUID, ptVolumeUID, petColorMap) {
  const ctScene = renderingEngine.getScene(SCENE_IDS.CT);
  const ptScene = renderingEngine.getScene(SCENE_IDS.PT);
  const fusionScene = renderingEngine.getScene(SCENE_IDS.FUSION);
  const ptMipScene = renderingEngine.getScene(SCENE_IDS.PTMIP);

  ctScene.setVolumes([{ volumeUID: ctVolumeUID, callback: setCTWWWC }]);
  ptScene.setVolumes([
    { volumeUID: ptVolumeUID, callback: setPetTransferFunction },
  ]);

  fusionScene.setVolumes([
    { volumeUID: ctVolumeUID, callback: setCTWWWC },
    {
      volumeUID: ptVolumeUID,
      callback: getSetPetColorMapTransferFunction(petColorMap),
    },
  ]);

  const ptVolume = imageCache.getImageVolume(ptVolumeUID);
  const ptVolumeDimensions = ptVolume.dimensions;

  // Only make the MIP as large as it needs to be. This coronal MIP will be
  // rotated so need the diagonal across the Axial Plane.

  const slabThickness = Math.sqrt(
    ptVolumeDimensions[0] * ptVolumeDimensions[0] +
      ptVolumeDimensions[1] * ptVolumeDimensions[1]
  );

  ptMipScene.setVolumes([
    {
      volumeUID: ptVolumeUID,
      callback: setPetTransferFunction,
      blendMode: BlendMode.MAXIMUM_INTENSITY_BLEND,
      slabThickness,
    },
  ]);
}

export default { setLayout, setVolumes };