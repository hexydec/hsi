export default bytes => bytes.slice().reverse().reduce((val, byte, i) => val + (byte << (i * 8)), 0) >>> 0;
