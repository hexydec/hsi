// export default (r, g, b, a, size = 256) => (r * 3 + g * 5 + b * 7 + a * 11) % size;
export default (bytes, size) => bytes.reduce((val, byte, i) => val + (byte * (i + 2)), 0) % size;;
