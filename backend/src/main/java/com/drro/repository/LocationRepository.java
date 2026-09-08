package com.drro.repository;

import com.drro.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    @Query("SELECT l FROM Location l LEFT JOIN FETCH l.disaster WHERE l.disaster.disasterId = :disasterId")
    List<Location> findByDisaster_DisasterId(@Param("disasterId") Long disasterId);

    @Query("SELECT l FROM Location l LEFT JOIN FETCH l.disaster")
    List<Location> findAllWithDisaster();
}
