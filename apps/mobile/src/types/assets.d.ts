declare module "*.jpg" {
  const value: import("react-native").ImageSourcePropType;
  export default value;
}

declare module "*.png" {
  const value: import("react-native").ImageSourcePropType;
  export default value;
}

declare module "*.wav" {
  // Metro resolves a require()'d audio asset to a numeric module id at
  // bundle time, which is exactly what expo-audio's AudioSource union
  // accepts (string | number | null | { uri/assetId/headers }).
  const value: number;
  export default value;
}
