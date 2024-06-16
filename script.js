/////////////////////////////////
//                             //
//           Classes           //
//                             //
/////////////////////////////////

////////////////////////////////////////////
//                                        //
//                Particle                //
//                                        //
////////////////////////////////////////////
class Particle {
  constructor() {
    this.orbitY = Math.random() * _h;   // orbit values are separate from on-screen particle x/y; the y position of an orbit moves
    this.orbitX = _w / 2;               // down the screen over a particle's "lifetime"
    this.orbitWidth = _w / 2;           // orbit widths are always proportional to the particle's height from the bottom of the screen
    this.orbitHeight = 20;              // orbitHeight is theoretical max height of an orbit

    this.x;               // on-screen position
    this.y;               // on-screen position
    this.prevX = this.x;  // position vars stored for use as moveTo points in drawing
    this.prevY = this.y;  // position vars stored for use as moveTo points in drawing

    this.vSpeed = 0.06 + (Math.random() * 0.03);  // the speed with which an orbit is moving down the screen
    this.hSpeed = 0.25 * (this.orbitY / _h);      // the horizontal speed with which a particle is traversing its orbit

    this.rotation = Math.random() * 2;            // the current proportion of Math.PI that a particle has traversed through its orbit
    this.hue = Math.round(Math.random() * 360);   // a randomized color wheel variable
    this.lightness = 0;                           // lightness increases as the particle moves toward the bottom of the screen, from 50 -> 100
    this.size = Math.ceil(Math.random() * 3);     // particle size (later multiplied by DPR in SceneCanvas draw)
    this.wasReset = false;                        // tracks whether the particle was reset on its last iteration, prevent it from being drawn when it jumps to its new random location
  }

  //////////////////////////////////////////////
  //                Move Method               //
  //////////////////////////////////////////////
  move(refreshThrottle) {
    this.wasReset = false;    // particles can always set their wasReset to 0 at the start of a move, since drawing occurs after all particles are moved
    
    this.prevX = this.x;  // update prev positions to current positions before movement
    this.prevY = this.y;  // update prev positions to current positions before movement
    
    if (frozen) { return; }   // if the user is interacting to cause a freeze, exit here

    // if the particle has reached the singularity, re-randomize it
    if (this.orbitY + (this.vSpeed * refreshThrottle) >= _h - (20 * dpr)) {
      this.reset();
      this.wasReset = true;
    }
    
    let heightProportion = this.orbitY / _h;          // the proportion of the screen height the particle's orbit has traversed
    this.orbitY += (this.vSpeed * refreshThrottle);   // update the particle's orbit's y value, adjusting for refresh rate
    
    this.lightness = 50 * heightProportion;   // update the particle's lightness based on its nearness to the bottom of the screen
    
    this.hSpeed = (0.01 + (0.25 * heightProportion * heightProportion * heightProportion)) * movementFactor;    // update h speed, adjusting for the user's interaction-based movementFactor
    this.rotation = this.rotation + (this.hSpeed * refreshThrottle) > 2 ? 0 : this.rotation + (this.hSpeed * refreshThrottle);  // this helps cap rotation values at Math.PI * 2, resetting to 0 if > 2
    
    this.orbitWidth = (dpr * 4) + ((_w / 2) * (1 - heightProportion) * (1 - heightProportion));   // adjust orbit width to be relative to heightProportion squared (squaring gives a lovely funnel appearance, instead of a plain wedge shape)
    this.vSpeed += ((this.vSpeed * gravity * gravity) * refreshThrottle);   // update vSpeed, adjusting for refresh rate
    this.x = this.orbitX + Math.cos(Math.PI * this.rotation) * (this.orbitWidth);   // update x position
    this.y = this.orbitY + Math.sin(Math.PI * this.rotation) * (this.orbitHeight * (1 - heightProportion));   // update y position
  };

  ////////////////////////////////////////////////
  //                Reset Method                //
  ////////////////////////////////////////////////
  // re-randomizes a particle
  reset () {
    this.prevX = this.x;
    this.prevY = this.y;

    this.orbitY = Math.random() * _h;
    this.orbitWidth = _w / 2;
    this.vSpeed = 0.06 + (Math.random() * 0.03);
    this.hSpeed = 0.25 * (this.orbitY / _h);
    this.rotation = Math.random() * 2;
    this.size = 1 + Math.random() * 2;
    this.hue = Math.round(Math.random() * 360);
  };
}

///////////////////////////////////////////////
//                                           //
//                SceneCanvas                //
//                                           //
///////////////////////////////////////////////
class SceneCanvas {
  constructor(canvasId) {   // the SceneCanvas constructor needs an HTML canvas element ID to initialize
    this.canvas = document.getElementById(canvasId);
    this.canvas.width = _w;   // underscored dimensions are already adjusted for DPR
    this.canvas.height = _h;  // underscored dimensions are already adjusted for DPR

    this.ctx = canvas.getContext('2d');
    this.ctx.lineCap = 'round';   // rounds lines, and draws (essentially) dots when line widths are very short
    
    // the colors for the singularity into which particles are swirling
    this.singularityGrad = this.ctx.createRadialGradient(_w/2, _h, 0, _w/2, _h, 50 * dpr);
    this.singularityGrad.addColorStop(0.5, 'hsla(0,100%,100%,1)');
    this.singularityGrad.addColorStop(1, 'hsla(0,0%,0%,0)');
    this.ctx.fillStyle = this.singularityGrad;
  }

  ///////////////////////////////////////////////
  //                Clear Method               //
  ///////////////////////////////////////////////
  // clear the canvas at a variable rate depending on refresh rate, guaranteeing a similar visual across any framerate
  clear(refreshThrottle) {
    this.ctx.fillStyle = `rgba(0,0,0,${refreshThrottle})`;
    this.ctx.fillRect(0, 0, _w, _h);
  }

  //////////////////////////////////////////////////////
  //                drawParticle Method               //
  //////////////////////////////////////////////////////
  drawParticle(particle) {
    // if a particle was reset, skip its drawing step
    if (!particle.wasReset) {
      this.ctx.strokeStyle = `hsl(${particle.hue}, 100%, ${50 + particle.lightness}%`;  // adjust context hue/lightness to particle's
      this.ctx.lineWidth = particle.size * dpr;   // adjust line width to DPR

      this.ctx.beginPath();
      this.ctx.moveTo(particle.prevX, particle.prevY);
      this.ctx.lineTo(particle.x, particle.y);
      this.ctx.stroke();
    }
  }

  /////////////////////////////////////////////////////////
  //                drawSingularity Method               //
  /////////////////////////////////////////////////////////
  drawSingularity() {
    this.ctx.fillStyle = this.singularityGrad;
    this.ctx.arc(_w/2, _h, 50 * dpr, 0, Math.PI * 2, true);   // for the arc method, adjust the radius (3rd parameter) to the DPR
    this.ctx.fill();
  }
}

/////////////////////////////////
//                             //
//           Globals           //
//                             //
/////////////////////////////////

// dpr and dpr-adjusted window variables
let dpr = window.devicePixelRatio;
let _w = window.innerWidth * dpr;
let _h = window.innerHeight * dpr;

// global variables governing all particle movement and related interaction functionality
let gravity = 0.1;
let movementFactor = 1;
let lastTouchMoveX = 0
let frozen = false;
let touchDistance;

// instantiate a SceneCanvas
let sceneCanvas = new SceneCanvas('canvas');

// globals for particle array
let particleArray = [];
let particleCount = 500;
// populate particle array
for (let i = 0; i < particleCount; i++) {
  particleArray.push(new Particle());
}

///////////////////////////////////
//                               //
//           Listeners           //
//                               //
///////////////////////////////////

// reload the scene on resize
window.addEventListener('resize', ()=>{ location.reload(); })

// handle user mouse interaction
document.addEventListener('mousedown', handleHoldStart);
document.addEventListener('mouseup', handleHoldEnd);
document.addEventListener('mousemove', handleHoldMove);

// handle user touch interaction; passive: false on all touch events to prevent firing parent page events (e.g., scroll)
document.addEventListener('touchstart', handleHoldStart, { passive: false })
document.addEventListener('touchend', handleHoldEnd, { passive: false })
document.addEventListener('touchmove', handleHoldMove, { passive: false })

// freeze the scene while the user is holding (and also not moving)
function handleHoldStart(e) {
  e.stopImmediatePropagation();
  e.preventDefault();
  lastTouchMoveX = 0;
  frozen = true;
}

// automatically unfreeze when the user is no longer holding
function handleHoldEnd(e) {
  e.stopImmediatePropagation();
  e.preventDefault();
  frozen = false;
}

// handle click-drag and touch-drag
function handleHoldMove(e){
  if (!e.changedTouches && e.buttons == '0') { return; }    // if the user is moving the mouse but not holding a button, do nothing

  e.stopImmediatePropagation();
  e.preventDefault();

  frozen = false;
  // next line: if changedTouches is undefined, the userX is the mouseX; otherwise, it's the latest touch location
  let userX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;   
  userX *= dpr;     // adjust for dpr

  touchDistance = lastTouchMoveX - userX;   // update touchDistance with the difference between touches

  // take no action if this is the first movement; otherwise, set the speed relative to the minimum target FPS
  if (lastTouchMoveX != 0 && touchDistance) {
    movementFactor = touchDistance / (-1 * minTargetFPS);
  }

  // update the last move X position with the user's current interaction position
  lastTouchMoveX = userX;
}

/////////////////////////////////
//                             //
//           Animate           //
//                             //
/////////////////////////////////

// these variables will aid in scaling movement and speed updates to equivalent apparent values across any frame rate
let lastCallback = performance.now();
let minTargetFPS = 30;
let refreshThrottle = 1;

function draw(callbackTime) {
  refreshThrottle = Math.min((callbackTime - lastCallback) / minTargetFPS, 1);    // setting a minimum refreshThrottle of 1 prevents very large buildups of refreshThrottle when the page or tab is not focused
  lastCallback = callbackTime;
  
  sceneCanvas.clear(refreshThrottle);   // the canvas clear method uses refreshThrottle to adjust the fade at different framerates to be visually equivalent
  
  // iterate through all particles and update/draw
  for (let j = 0; j < particleArray.length; j++) {
    let particle = particleArray[j];
    particle.move(refreshThrottle);
    sceneCanvas.drawParticle(particle);
  }
  sceneCanvas.drawSingularity();
    
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
