package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.RolDTO;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Rol;
import com.capstone.Capstone_back.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RolService {

    private final RolRepository rolRepository;

    @Transactional(readOnly = true)
    public List<RolDTO> findAll() {
        return rolRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RolDTO findById(Long id) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado con ID: " + id));
        return mapToDTO(rol);
    }

    @Transactional
    public RolDTO create(RolDTO dto) {
        Rol rol = Rol.builder()
                .nombre(dto.getNombre())
                .build();
        return mapToDTO(rolRepository.save(rol));
    }

    public RolDTO mapToDTO(Rol rol) {
        if (rol == null) return null;
        return RolDTO.builder()
                .id(rol.getId())
                .nombre(rol.getNombre())
                .build();
    }
}
