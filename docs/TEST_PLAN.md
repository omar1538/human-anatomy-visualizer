# Real-device test plan

Automated tests (`npm test`) and the headless browser checks cannot show how the app behaves on
real hardware. This checklist covers what only a person with the device can check. Run it on the
**deployed site** (<https://omar1538.github.io/human-anatomy-visualizer/>) unless a step says
otherwise, and write the results in the tables. Add a row per device; keep failed runs.

Useful facts before starting:

- Add `?dev` to the address to show the developer panel: its first line says **`Renderer: WebGPU`**
  or **`Renderer: WebGL 2`**. In a console, `viewer.backend` gives the same answer.
- On a phone, the console is reached from a computer: Android with Chrome's `chrome://inspect`
  (USB debugging on), iPhone with Safari's Develop menu on a Mac.
- The app only draws when something changes, to save battery. Measure frame rates **while
  rotating the model continuously**, never while it is still.
- Phones that support AR currently always start on WebGL 2 (see `docs/STATUS.md`, decision 1).
  Write down the backend you see; it is not a failure in itself.

## 1. Laptop: Chrome or Edge (WebGPU)

1. Open the site with `?dev`. The panel shows `Renderer: WebGPU`.
2. Open DevTools (F12) > Console. Reload. There are no red errors (the yellow "WebGPU is not
   available" warning must not appear here).
3. Rotate, zoom (wheel) and pan (right-click drag) for 30 seconds: no stutter, no flicker.
4. Measure the frame rate with the method in section 6 while rotating.
5. Select a structure: the Learn panel shows its sheet. Switch EN/FR. Open "Slice", try the three
   axes and the position slider. Open the About window (i).

| Date | Tester | Laptop and GPU | OS  | Browser and version | Backend shown | FPS while rotating | Console errors | Result | Notes |
| ---- | ------ | -------------- | --- | ------------------- | ------------- | ------------------ | -------------- | ------ | ----- |
|      |        |                |     |                     |               |                    |                |        |       |

## 2. WebGL 2 fallback: Firefox, or WebGPU switched off

Use Firefox. If your Firefox version already has WebGPU, switch it off: open `about:config`, set
`dom.webgpu.enabled` to `false`, restart Firefox.

1. Open the site with `?dev`. The panel shows `Renderer: WebGL 2`.
2. On the same computer, put this window next to the Chrome one from section 1, both the same
   size, both after "Reset view". Compare: the heart, the colours, the lighting, the layers and a
   cut ("Slice") should look the same. Take two screenshots for the design notebook.
3. Repeat steps 2 to 5 of section 1.

| Date | Tester | Computer | Browser and version | WebGPU switched off how | Backend shown | Looks identical to WebGPU? | FPS while rotating | Console errors | Result | Notes |
| ---- | ------ | -------- | ------------------- | ----------------------- | ------------- | -------------------------- | ------------------ | -------------- | ------ | ----- |
|      |        |          |                     |                         |               |                            |                    |                |        |       |

## 3. Mid-range Android phone (Chrome)

"Mid-range" means a phone a student would own, not a flagship. Write its model and price class.

1. **First visit:** open the site in Chrome, portrait. The whole heart is visible (not cut off
   left and right). Wait until it has fully loaded.
2. **Install:** Chrome menu > "Install app" (or "Add to Home screen"). The app icon appears.
3. **Offline:** turn on airplane mode. Open the app from its icon. The heart loads (five layers,
   not a grey placeholder body).
4. **Learn mode:** tap a structure: the bottom sheet shows its sheet. Switch EN/FR. Tap "Part of"
   and a structure in the group list.
5. **Layers:** open "Layers", hide and show each group.
6. **Slicing:** open "Slice", choose each axis, move the slider, tick "Keep the other half".
7. **Rotation:** turn the phone to landscape and back. The heart stays fully visible.
8. **Frame rate:** with section 6, while rotating with one finger.
9. **AR** (only if the "View in AR" button is shown): turn airplane mode off. Select a structure,
   tap "View in AR", allow the camera, point at a table, tap to place. Walk around it. Tap "Exit AR".
   If the button is not shown, write "no AR button" and whether the phone is on Google's ARCore
   list.

| Date | Tester | Phone model (price class) | Android version | Chrome version | Backend shown | Install | Offline reopen | Learn mode | Layers | Slicing | Rotation | FPS while rotating | AR  | Notes |
| ---- | ------ | ------------------------- | --------------- | -------------- | ------------- | ------- | -------------- | ---------- | ------ | ------- | -------- | ------------------ | --- | ----- |
|      |        |                           |                 |                |               |         |                |            |        |         |          |                    |     |       |

## 4. iPhone (Safari)

1. Open the site in Safari, portrait. The whole heart is visible.
2. **Install:** Share > "Add to Home Screen". Open the app from its icon: it opens without the
   Safari address bar.
3. **Offline:** turn on airplane mode. Close the app completely, open it again from the icon. The
   heart and the Learn panel work.
4. Try Learn mode, EN/FR, layers and slicing as in section 3.
5. The "View in AR" button must **not** appear (WebXR AR is not available in Safari on iPhone).
6. With `?dev` in Safari (before installing), note the backend shown.

| Date | Tester | iPhone model | iOS version | Backend shown | Add to Home Screen | Offline reopen | Learn mode, layers, slicing | No AR button | Notes |
| ---- | ------ | ------------ | ----------- | ------------- | ------------------ | -------------- | --------------------------- | ------------ | ----- |
|      |        |              |             |               |                    |                |                             |              |       |

## 5. Pass criteria

- Every step works, with no red console error.
- The heart is never cut off at the screen edges in the default view or after "Reset view".
- Offline: the app opens with the real heart and the Learn panel after one visit online.
- "Smooth" (cahier des charges §3.2) is not defined by a number in the cahier des charges. **Team
  proposal, to agree on:** while rotating, at least 30 FPS on average on the mid-range phone and
  at least 55 FPS on the laptop, with fewer than 5 % of frames slower than 50 ms.

## 6. Measuring the frame rate

**Method A (preferred): Chrome's frame rendering stats.** Works on a laptop, and on an Android phone
through `chrome://inspect` from a computer.

1. DevTools > ⋮ > More tools > **Rendering** > tick **Frame rendering stats**. A small panel shows
   the frame rate.
2. Rotate the heart continuously for 10 seconds (drag with the mouse or one finger).
3. Write the typical value shown during the rotation, not the value at rest.

**Method B: a console snippet** (any browser with a console). Paste it, then rotate the heart
continuously until the result appears (10 seconds):

```js
(() => {
  const t0 = performance.now();
  let frames = 0,
    slow = 0,
    last = t0;
  function tick(now) {
    frames++;
    if (now - last > 50) slow++;
    last = now;
    if (now - t0 < 10000) requestAnimationFrame(tick);
    else
      console.log(
        `${(frames / ((now - t0) / 1000)).toFixed(1)} FPS on average, ${slow} of ${frames} frames slower than 50 ms`,
      );
  }
  requestAnimationFrame(tick);
})();
```

Limit of method B: it measures how often the browser can run a frame on the main thread. With
WebGPU, part of the drawing happens in the GPU process, so a GPU-bound slowdown can be
underestimated. Prefer method A when it is available, and write which method you used.
