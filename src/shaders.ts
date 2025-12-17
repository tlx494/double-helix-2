export const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vSize;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vColor = color;
    vSize = size;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = `
  varying vec3 vColor;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    float alpha = 1.0 - smoothstep(0.0, 0.3, dist);
    
    // Calculate normal from point coordinate (spherical)
    vec3 normal = normalize(vec3(center * 2.0, sqrt(max(0.0, 1.0 - dot(center, center) * 4.0))));
    
    // Calculate view direction
    vec3 viewDir = normalize(-vPosition);
    
    // Fresnel effect for edge glow
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.5);
    
    // Specular highlight (shiny reflection) - multiple light sources for more sparkle
    vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
    vec3 lightDir2 = normalize(vec3(-1.0, 0.5, 1.0));
    vec3 reflectDir1 = reflect(-lightDir1, normal);
    vec3 reflectDir2 = reflect(-lightDir2, normal);
    float specular1 = pow(max(dot(viewDir, reflectDir1), 0.0), 64.0);
    float specular2 = pow(max(dot(viewDir, reflectDir2), 0.0), 48.0);
    float specular = specular1 + specular2 * 0.6;
    
    // Rim lighting for extra shine
    float rim = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    
    // Combine colors with shiny effects
    vec3 finalColor = vColor;
    finalColor += vec3(1.0, 1.0, 1.0) * specular * 1.2; // Bright white specular highlight
    finalColor += vColor * fresnel * 0.6; // Edge glow with base color
    finalColor += vec3(0.4, 0.6, 1.0) * rim * 0.4; // Blue rim light
    finalColor += vec3(1.0, 1.0, 1.0) * rim * 0.2; // White rim highlight
    
    // Increase brightness and saturation for shiny metallic look
    finalColor = mix(finalColor, vec3(1.0), specular * 0.4);
    finalColor = mix(finalColor, vColor * 1.3, 0.3); // Boost saturation
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

