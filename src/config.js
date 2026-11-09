'use strict';
const CATS=['Broken Streetlight','Pothole','Damaged Road','Garbage Problem','Water Leak','Fallen Tree','Flooding','Blocked Drainage','Damaged Sidewalk','Damaged Public Facility','Road Obstruction','Other'];
const MSG={VERIFIED:'Your report has been verified.',ASSIGNED:'Your report has been assigned to the appropriate office.','IN PROGRESS':'Action has started on your reported concern.',RESOLVED:'Your reported concern has been marked as resolved.',REJECTED:'Your report was reviewed and could not be accepted.'};
const OPEN=['SUBMITTED','UNDER REVIEW','VERIFIED','ASSIGNED','IN PROGRESS'],WORKABLE=['VERIFIED','ASSIGNED','IN PROGRESS'];
module.exports={CATS,MSG,OPEN,WORKABLE};
