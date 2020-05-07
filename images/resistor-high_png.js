/* eslint-disable */
import simLauncher from '../../joist/js/simLauncher.js';
const image = new Image();
const unlock = simLauncher.createLock( image );
image.onload = unlock;
image.src = 'data:image/png;base64,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';
export default image;