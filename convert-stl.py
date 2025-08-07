#!/usr/bin/env python3
import subprocess
import sys
import os

def check_dependencies():
    """Check if required tools are installed"""
    try:
        # Check if npm is available
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("npm not found. Please install Node.js and npm first.")
            return False
        
        # Check if obj2gltf is installed
        result = subprocess.run(['npx', 'obj2gltf', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("Installing obj2gltf...")
            install_result = subprocess.run(['npm', 'install', '-g', 'obj2gltf'], capture_output=True, text=True)
            if install_result.returncode != 0:
                print("Failed to install obj2gltf:", install_result.stderr)
                return False
        
        return True
    except FileNotFoundError:
        print("npm not found. Please install Node.js and npm first.")
        return False

def stl_to_obj(stl_file, obj_file):
    """Convert STL to OBJ using a simple Python approach"""
    print(f"Converting {stl_file} to {obj_file}...")
    
    try:
        # Read STL file
        with open(stl_file, 'r') as f:
            content = f.read()
        
        # Simple STL to OBJ conversion
        vertices = []
        faces = []
        
        lines = content.split('\n')
        current_vertices = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('vertex'):
                parts = line.split()
                if len(parts) == 4:
                    x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                    current_vertices.append((x, y, z))
                    
            elif line.startswith('endfacet'):
                if len(current_vertices) == 3:
                    # Add vertices and create face
                    face_indices = []
                    for vertex in current_vertices:
                        if vertex not in vertices:
                            vertices.append(vertex)
                        face_indices.append(vertices.index(vertex) + 1)  # OBJ uses 1-based indexing
                    faces.append(face_indices)
                current_vertices = []
        
        # Write OBJ file
        with open(obj_file, 'w') as f:
            f.write("# Converted from STL\n")
            for vertex in vertices:
                f.write(f"v {vertex[0]} {vertex[1]} {vertex[2]}\n")
            for face in faces:
                f.write(f"f {face[0]} {face[1]} {face[2]}\n")
        
        print(f"Created {obj_file} with {len(vertices)} vertices and {len(faces)} faces")
        return True
        
    except Exception as e:
        print(f"Error converting STL to OBJ: {e}")
        return False

def obj_to_gltf(obj_file, gltf_file):
    """Convert OBJ to GLTF using obj2gltf"""
    print(f"Converting {obj_file} to {gltf_file}...")
    
    try:
        result = subprocess.run([
            'npx', 'obj2gltf',
            '-i', obj_file,
            '-o', gltf_file,
            '--metallicFactor', '0.0',
            '--roughnessFactor', '0.8'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"Successfully created {gltf_file}")
            return True
        else:
            print(f"Error converting to GLTF: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Error running obj2gltf: {e}")
        return False

def main():
    stl_file = "agrinota-stake-model.stl"
    obj_file = "agrinota-stake-web.obj"
    gltf_file = "agrinota-stake-web.glb"
    
    if not os.path.exists(stl_file):
        print(f"STL file not found: {stl_file}")
        return
    
    print("Converting working STL to web-optimized GLB format...")
    
    # Step 1: Convert STL to OBJ
    if not stl_to_obj(stl_file, obj_file):
        return
    
    # Step 2: Check dependencies and convert OBJ to GLTF
    if check_dependencies():
        if obj_to_gltf(obj_file, gltf_file):
            print(f"\n✅ Success! Created web-optimized {gltf_file}")
            print(f"You can now use this GLB file in your 3D viewer")
            
            # Clean up temporary OBJ file
            if os.path.exists(obj_file):
                os.remove(obj_file)
                print(f"Cleaned up temporary {obj_file}")
        else:
            print("Failed to create GLB file")
    else:
        print("Skipping GLB conversion due to missing dependencies")
        print(f"But you can still use the OBJ file: {obj_file}")

if __name__ == "__main__":
    main()