import { useState, useEffect } from "react";
import styles from "./styles/LiveEventPopup.module.scss";
import { api } from "../../../../services";
import FormData from "../../../../data/FormData.json";

const LiveEventPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEventOngoing, setIsEventOngoing] = useState(false);
  const [eventImage, setEventImage] = useState("");
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await api.get("/api/form/getAllForms");
        let fetchedEvents = [];

        if (response.status === 200) {
          fetchedEvents = response.data.events;
        } else {
          fetchedEvents = FormData.events;
        }

        const currentEvent = fetchedEvents.filter(
          (event) =>
            event.info.isEventPast === false &&
            event.info.isPublic === true &&
            event.info.relatedEvent === "null"
        );

        if (currentEvent && !sessionStorage.getItem("popupDisplayed")) {
          setIsEventOngoing(true);

          const imageUrl = currentEvent[0].info.eventImg;
          const currentId = currentEvent[0].id;

          setEventImage(imageUrl);
          setEventId(currentId);

          const timer = setTimeout(() => {
            setIsVisible(true);
            sessionStorage.setItem("popupDisplayed", "true");
          }, 2500);

          return () => clearTimeout(timer);
        } else {
          setIsEventOngoing(false);
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };

    fetchEventData();
  }, []);

  useEffect(() => {
    if (isEventOngoing) {
      if (isVisible) {
        document.body.classList.add(styles.lockScroll);
      } else {
        document.body.classList.remove(styles.lockScroll);
      }
    }

    return () => {
      document.body.classList.remove(styles.lockScroll);
    };
  }, [isVisible, isEventOngoing]);

  const closePopup = () => {
    setIsVisible(false);
  };

  return (
    <>
      {isEventOngoing && (
        <div className={`${styles.popup} ${isVisible ? styles.fadeIn : ""}`}>
          <div className={styles.popupContent}>
            <button className={styles.closeButton} onClick={closePopup}>
              ×
            </button>
            <a href={`/Events/${eventId}`}>
              <img src={eventImage} alt="Event" className={styles.popupContent} />
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default LiveEventPopup;
