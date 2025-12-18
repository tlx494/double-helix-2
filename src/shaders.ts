export const vertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float glow;
  varying vec3 vColor;
  varying float vSize;
  varying float vGlow;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vColor = color;
    vSize = size;
    vGlow = glow;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    // Make glowing particles larger
    gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + glow * 2.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = `
  varying vec3 vColor;
  varying float vGlow;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    // Hard edge with sharp cutoff
    float hardEdge = 0.25;
    float coreAlpha = step(dist, hardEdge);
    
    // Glow effect extending beyond the hard edge
    float glowStart = hardEdge;
    float glowEnd = 0.45;
    float glowAlpha = 1.0 - smoothstep(glowStart, glowEnd, dist);
    glowAlpha *= 0.5; // Make glow more subtle
    
    // Enhanced glow for helix ends
    float endGlowEnd = 0.6; // Extended glow range for ends
    float endGlowAlpha = 1.0 - smoothstep(glowStart, endGlowEnd, dist);
    endGlowAlpha *= vGlow * 1.5; // Bright glow for ends
    
    // Combine hard edge and glow
    float alpha = min(1.0, coreAlpha + glowAlpha + endGlowAlpha);
    
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
    finalColor += vColor * rim * 0.5; // Rim glow with base color
    
    // Increase brightness for shiny effect
    finalColor = mix(finalColor, vec3(1.0), specular * 0.3);
    
    // Bright glow for helix ends - make them very bright
    finalColor += vec3(1.0, 1.0, 1.0) * vGlow * 2.0; // Bright white glow
    finalColor += vColor * vGlow * 1.5; // Enhanced base color
    
    // Add cool glow tint in the glow area (cyan/purple mix)
    if (dist > hardEdge) {
      vec3 glowTint = mix(vec3(0.3, 0.7, 1.0), vec3(0.7, 0.4, 1.0), rim); // Cyan to purple
      finalColor = mix(finalColor, glowTint, glowAlpha * 0.4);
      
      // Extra bright glow tint for ends
      vec3 endGlowTint = mix(vec3(0.5, 0.9, 1.0), vec3(0.9, 0.6, 1.0), rim); // Brighter cyan to purple
      finalColor = mix(finalColor, endGlowTint, endGlowAlpha * 0.6);
    }
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

