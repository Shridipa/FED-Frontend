import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services";
import style from "./styles/Event.module.scss";
import AuthContext from "../../context/AuthContext";
import { EventCard } from "../../components";
import FormData from "../../data/FormData.json";
import ring from "../../assets/images/ring.svg";
import { MdKeyboardArrowRight } from "react-icons/md";
import { ComponentLoading } from "../../microInteraction";
import { RecoveryContext } from "../../context/RecoveryContext";
import ShareTeamData from "../../features/Modals/Event/ShareModal/ShareTeamData";

const Event = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { events } = FormData;
  const [isOpen, setOpenModal] = useState(false);
  const [pastEvents, setPastEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [privateEvents, setPrivateEvents] = useState([]);
  const recoveryCtx = useContext(RecoveryContext);
  const [isRegisteredInRelatedEvents, setIsRegisteredInRelatedEvents] =
    useState(false);
  const [eventName, setEventName] = useState("");
  const [parentEventCount, setParentEventCount] = useState([]);

  useEffect(() => {
    if ((recoveryCtx.teamCode && recoveryCtx.teamName) || recoveryCtx.successMessage) {
      if (!isOpen) {
        setOpenModal(true);
      }
    }
  }, [recoveryCtx.teamCode, recoveryCtx.successMessage, recoveryCtx.teamName, isOpen]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/api/form/getAllForms");
        let fetchedEvents = [];
        
        if (response.status === 200) {
          fetchedEvents = response.data.events;
        } else {
          console.warn("API returned non-200 status, falling back to local data");
          fetchedEvents = events;
        }

        const sortedEvents = fetchedEvents.sort((a, b) => {
          const priorityA = parseInt(a.info.eventPriority, 10);
          const priorityB = parseInt(b.info.eventPriority, 10);
          const dateA = new Date(a.info.eventDate);
          const dateB = new Date(b.info.eventDate);
          const titleA = a.info.eventTitle || "";
          const titleB = b.info.eventTitle || "";

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          return titleA.localeCompare(titleB);
        });

        // Separate ongoing and past events
        const ongoing = sortedEvents.filter((event) => !event.info.isEventPast);
        const privateEvent = sortedEvents.filter((event) => !event.info.isPublic);
        const past = sortedEvents.filter((event) => event.info.isEventPast);
        const sortedPastEvents = past.sort((a, b) => {
          return new Date(b.info.eventDate) - new Date(a.info.eventDate);
        });

        setOngoingEvents(ongoing);
        setPastEvents(sortedPastEvents);
        setPrivateEvents(privateEvent);
        setError(null);
      } catch (error) {
        console.error("Error fetching events, using fallback:", error);
        // Fallback to local JSON data
        const sortedEvents = events.sort((a, b) => {
          const dateA = new Date(a.info.eventDate);
          const dateB = new Date(b.info.eventDate);
          return dateA.getTime() - dateB.getTime();
        });

        // Use isPublic: true as a preference, but if none are found, show all ongoing
        let ongoing = sortedEvents.filter((event) => !event.info.isEventPast && event.info.isPublic);
        if (ongoing.length === 0) {
          ongoing = sortedEvents.filter((event) => !event.info.isEventPast);
        }

        const past = sortedEvents.filter((event) => event.info.isEventPast);
        const sortedPastEvents = past.sort((a, b) => {
          return new Date(b.info.eventDate) - new Date(a.info.eventDate);
        });

        setOngoingEvents(ongoing);
        setPastEvents(sortedPastEvents);
        setError(null); // Clear error since we have fallback data
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [events]);

  const handleShare = () => {
    if (recoveryCtx.teamCode && recoveryCtx.teamName || recoveryCtx.successMessage) { //if error comes put recoveryCtx.successMessage in or and setSuccessMessage(null)
      const { setTeamCode, setTeamName, setSuccessMessage } = recoveryCtx;
      setTeamCode(null);
      setTeamName(null); //have to check later on 
      setSuccessMessage(null);
      setOpenModal(false);
    }
  };

  useEffect(() => {
    const eventWithNullRelated = ongoingEvents.find(
      (event) => event.info.relatedEvent === "null"
    );

    const eventName = eventWithNullRelated
      ? eventWithNullRelated.info.eventTitle
      : "";
    setEventName(eventName);
  }, [ongoingEvents]);

  useEffect(() => {
    const registeredEventIds = authCtx.user.regForm || [];

    const parentEvents = registeredEventIds
      .map((id) => events.find((event) => event.id === id)) // Map IDs to event objects
      .filter((event) => event?.info?.relatedEvent == null || event.info.relatedEvent === "null");

    setParentEventCount(parentEvents.length);
    // console.log(parentEventCount);

    const relatedEventIds = ongoingEvents
      .map((event) => event.info.relatedEvent)
      .filter((id) => id !== null && id !== undefined && id !== "null")
      .filter((id, index, self) => self.indexOf(id) === index);

    let isRegisteredInRelatedEvents = false;
    if (registeredEventIds.length > 0 && relatedEventIds.length > 0) {
      isRegisteredInRelatedEvents = relatedEventIds.some((relatedEventId) =>
        registeredEventIds.includes(relatedEventId)
      );
    }

    if (isRegisteredInRelatedEvents) {
      setIsRegisteredInRelatedEvents(true);
    }
  }, [ongoingEvents, authCtx.user.regForm, events]);

  const customStyles = {
    eventname: {
      fontSize: "1.2rem",
    },
    registerbtn: {
      width: "8rem",
      fontSize: ".721rem",
    },
    eventnamep: {
      fontSize: "0.7rem",
    },
  };

  const teamCodeAndName = {
    teamCode: recoveryCtx.teamCode,
    teamName: recoveryCtx.teamName,
  };
  // console.log(teamCodeAndName);

  const successMessage = {
    successMessage: recoveryCtx.successMessage
  };
  // console.log(successMessage);

  // Slice the public pastEvents array to show only the first 4 events
  const displayedPastEvents = pastEvents
    .filter((event) => event.info.isPublic)
    .slice(0, 4);

  return (
    <>

      {isOpen && (
        <ShareTeamData onClose={handleShare} teamData={teamCodeAndName} successMessage={successMessage} />
      )}
      <div className={style.main}>
        <div style={{ display: "flex" }}>
          {isLoading ? (
            <>
              <ComponentLoading
                customStyles={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  marginTop: "10rem",
                  marginBottom: "10rem",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              />
            </>
          ) : error ? (
            <div className={style.error}>{error.message}</div>
          ) : (
            <>
              {ongoingEvents.length > 0 && privateEvents.length > 0 ? (
                <div className={style.line} style={{ marginTop: "3rem" }}></div>
              ) : privateEvents.length > 0 && ongoingEvents.length === 0 ? (
                <div className={style.line} style={{ marginTop: "3rem" }}></div>
              ) : privateEvents.length === 0 && ongoingEvents.length > 0 ? (
                <div className={style.line} style={{ marginTop: "2rem" }}></div>
              ) : (
                <div className={style.line} style={{ marginTop: "3rem" }}></div>
              )}

              <div className={style.eventwhole}>

                <>
                      <div className={style.eventcard}>
                        <div
                          className={style.name}
                          style={{ marginBottom: "-1rem" }}
                        >
                          <img className={style.ring1} src={ring} alt="ring" />

                          <span className={style.w1}>Upcoming</span>
                          <span className={style.w2}>Event</span><br />

                        </div>
                      {!isRegisteredInRelatedEvents && parentEventCount == 0 &&
                        authCtx.isLoggedIn &&
                        authCtx.user.access === "USER" && (
                          <div className={style.notify}>
                            <span className={style.w1}>
                              {" "}
                              Register yourself in{" "}
                              <span
                                style={{
                                  paddingTop: "10px",
                                  background: "var(--primary)",
                                  width: "20%",
                                  WebkitBackgroundClip: "text",
                                  color: "transparent",
                                }}
                              >
                                {eventName}
                              </span>
                            </span>
                          </div>
                        )}
                      <div className={style.cardsin}>
                        {ongoingEvents.slice(0, 1).map((event, index) => (
                          <div
                            style={{ height: "auto", width: "22rem" }}
                            key={index}
                          >
                            <EventCard
                              data={event}
                              onOpen={() => navigate(`/Events/${event.id}`)}
                              type="ongoing"
                              customStyles={customStyles}
                              modalpath="/Events/"
                              aosDisable={false}
                              isLoading={isLoading}
                              isRegisteredInRelatedEvents={
                                isRegisteredInRelatedEvents
                              }
                              eventName={eventName}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  <div
                    className={style.pasteventcard}
                    style={{
                      marginTop: ongoingEvents.length > 0 ? "3rem" : "3rem",
                      marginBottom: pastEvents.length > 4 ? "3rem" : "3rem",
                    }}
                  >
                    {pastEvents.length > 0 && (
                      <div>
                        <div
                          className={style.name}
                          style={{
                            marginTop:
                              privateEvents.length > 0 ? "-1rem" : "-1rem",
                          }}
                        >
                          <img className={style.ring2} src={ring} alt="ring" />
                          <span className={style.w1Past}>Past</span>
                          <span className={style.w2Past}>Events</span>
                        </div>
                        <div className={style.cardone}>
                          {displayedPastEvents.map((event, index) =>
                            event.info.isPublic ? (
                              <div
                                style={{ height: "auto", width: "22rem" }}
                                key={index}
                              >
                                <EventCard
                                  data={event}
                                  type="past"
                                  customStyles={customStyles}
                                  modalpath="/Events/pastEvents/"
                                  isLoading={isLoading}
                                />
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                    {pastEvents.length > 4 && (
                      <div className={style.bottom}>
                        <Link to="/Events/pastEvents">
                          <button className={style.seeall}>
                            See all <MdKeyboardArrowRight />
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              </div>
            </>
          )}
        </div>

        <div className={style.circle}></div>
        <div className={style.circleleft}></div>
        <div className={style.circleone}></div>
        <div className={style.circletwo}></div>
        <div className={style.circlethree}></div>
      </div>
    </>
  );
};

export default Event;
