import React, { useState } from 'react';

function ColorConverter() {
  const [hex, setHex] = useState('#000000');
  const [rgb, setRgb] = useState('rgb(0, 0, 0)');

  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handleHexChange = (value) => {
    setHex(value);
    const rgb = hexToRgb(value);
    if (rgb) {
      setRgb(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    }
  };

  return (
    <div className="tool-component">
      <h2>颜色转换</h2>
      <div className="input-area">
        <input
          type="color"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
      <div className="output-area">
        <h3>RGB值：</h3>
        <input
          type="text"
          value={rgb}
          readOnly
        />
      </div>
    </div>
  );
}

export default ColorConverter; 