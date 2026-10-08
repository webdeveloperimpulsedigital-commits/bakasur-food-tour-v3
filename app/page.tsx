'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BakasurVideoPlayer } from '@/components/BakasurVideoPlayer';
import { BakasurEatingStage } from '@/components/BakasurEatingStage';
import { BakasurTransitionLoader } from '@/components/BakasurTransitionLoader';
import { Frame1Welcome } from '@/components/frames/Frame1Welcome';
import { Frame2RestaurantSearch } from '@/components/frames/Frame2RestaurantSearch';
import { Frame3DishSelection } from '@/components/frames/Frame3DishSelection';
import { Frame4ManualDish } from '@/components/frames/Frame4ManualDish';
import { Frame5EatingBegins } from '@/components/frames/Frame5EatingBegins';
import { Frame6FeedingLoop } from '@/components/frames/Frame6FeedingLoop';
import { Frame6RandomFoodSpot } from '@/components/frames/Frame6RandomFoodSpot';
import { FoodTourSpot, getRandomFoodSpot } from '@/lib/foodTourSpots';
import { Frame7AcidityAppears } from '@/components/frames/Frame7AcidityAppears';
import { Frame8HelpBakasur } from '@/components/frames/Frame8HelpBakasur';
import { Frame9GastriumAnimation } from '@/components/frames/Frame9GastriumAnimation';
import { Frame10Submitted } from '@/components/frames/Frame10Submitted';
import { Frame11LiveMap } from '@/components/frames/Frame11LiveMap';
import { Frame12Registration } from '@/components/frames/Frame12Registration';
import { Frame13Confirmation } from '@/components/frames/Frame13Confirmation';
import { VideoTransitionOverlay } from '@/components/VideoTransitionOverlay';
import { Restaurant, Dish } from '@/lib/db';
import { getDishVisualAssets, formatCleanDishName } from '@/lib/dishAssets';
import { getOrCreateSessionId, resetSessionId, trackUserStep } from '@/lib/tracker';

export type FrameNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export default function CampaignPage() {
  // Campaign State
  const [currentFrame, setCurrentFrame] = useState<FrameNumber>(1);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Pune');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [feastingStage, setFeastingStage] = useState<1 | 2 | 3>(1);
  const [registeredMobile, setRegisteredMobile] = useState<string>('');
  const [participationId, setParticipationId] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regError, setRegError] = useState<string>('');
  const [tourSpotRound, setTourSpotRound] = useState<number>(0); // 0 = trailer, 1 = spot 1, 2 = spot 2
  const [currentTourSpot, setCurrentTourSpot] = useState<FoodTourSpot | null>(null);
  const [visitedSpotIds, setVisitedSpotIds] = useState<string[]>([]);

  // Full-width Video Interstitial Transition State
  const [activeTransitionVideo, setActiveTransitionVideo] = useState<{
    videoUrl: string;
    buttonText: string;
    nextFrame: FrameNumber;
    onVideoComplete?: () => void;
  } | null>(null);

  // Bakasur Transition Loader State
  const [isLoaderOpen, setIsLoaderOpen] = useState<boolean>(false);
  const [targetLoaderFrame, setTargetLoaderFrame] = useState<number>(2);
  const [loaderMessage, setLoaderMessage] = useState<string>('');

  const triggerFrameTransition = useCallback((targetFrame: FrameNumber, onTransitionComplete?: () => void, customMsg?: string) => {
    setCurrentFrame(targetFrame);
    if (onTransitionComplete) onTransitionComplete();
  }, []);

  // Audio FX generator (Disabled - All frames muted)
  const playSound = useCallback((_type?: string) => {}, []);

  // Initialize Session on Mount
  useEffect(() => {
    const sess = getOrCreateSessionId();
    setSessionId(sess);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const f = parseInt(params.get('frame') || '', 10);
      if (f >= 1 && f <= 13) {
        setCurrentFrame(f as FrameNumber);
      }
    }

    trackUserStep({
      sessionId: sess,
      stepName: 'frame_1_welcome',
      stepTitle: 'Frame 1: Welcome Screen Opened',
      stepNumber: 1,
      userLocation: selectedCity
    });
  }, [selectedCity]);

  // Real-time GPS detection on app mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          try {
            const res = await fetch(`/api/location?lat=${lat}&lng=${lng}`);
            const data = await res.json();
            if (data.success && data.detectedCity?.name) {
              setSelectedCity(data.detectedCity.name);
            }
          } catch {
            // Ignore
          }
        },
        () => {},
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Frame 1 -> Frame 2 (Welcome -> Restaurant Search)
  const handleStartTour = async () => {
    playSound('click');
    triggerFrameTransition(2);

    const activeSession = sessionId || getOrCreateSessionId();
    if (!sessionId) setSessionId(activeSession);

    // Save tour start session in DB immediately
    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_location: selectedCity,
          latitude: userCoords?.lat || null,
          longitude: userCoords?.lng || null,
          current_stage: 'frame_2_restaurant_search',
          current_step: 'restaurant_search',
          food_meter_percentage: 20
        })
      });
    } catch (err) {
      console.warn('Session start save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_2_restaurant_search',
      stepTitle: 'Frame 2: Restaurant Search Screen Opened',
      stepNumber: 2,
      userLocation: selectedCity,
      latitude: userCoords?.lat,
      longitude: userCoords?.lng
    });
  };

  // Frame 2 -> Frame 3 (Restaurant Chosen -> 3 Dish Options)
  const handleRestaurantConfirmed = async () => {
    playSound('click');
    triggerFrameTransition(3);

    const activeSession = sessionId || getOrCreateSessionId();

    // Persist restaurant selection to DB session
    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_location: selectedRestaurant?.city || selectedCity,
          latitude: selectedRestaurant?.latitude || userCoords?.lat,
          longitude: selectedRestaurant?.longitude || userCoords?.lng,
          restaurant_id: selectedRestaurant?.id,
          current_stage: 'frame_3_dish_selection',
          current_step: 'dish_selection'
        })
      });
    } catch (err) {
      console.warn('Restaurant confirm save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_3_dish_selection',
      stepTitle: `Frame 3: Dish Options Opened for ${selectedRestaurant?.name || 'Restaurant'}`,
      stepNumber: 3,
      restaurantId: selectedRestaurant?.id,
      userLocation: selectedRestaurant?.city || selectedCity,
      latitude: selectedRestaurant?.latitude || userCoords?.lat,
      longitude: selectedRestaurant?.longitude || userCoords?.lng,
      metadata: {
        restaurant_name: selectedRestaurant?.name,
        restaurant_id: selectedRestaurant?.id,
        city: selectedRestaurant?.city || selectedCity,
        latitude: selectedRestaurant?.latitude,
        longitude: selectedRestaurant?.longitude
      }
    });
  };

  // Frame 3 -> Frame 4 (Manual Dish Entry clicked)
  const handleGoToManualDish = () => {
    playSound('click');
    triggerFrameTransition(4);
    const activeSession = sessionId || getOrCreateSessionId();
    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_4_manual_dish',
      stepTitle: `Frame 4: Manual Dish Entry Opened for ${selectedRestaurant?.name || 'Restaurant'}`,
      stepNumber: 4,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 3 / 4 -> Frame 5 (Dish Chosen -> Eating Begins)
  const handleDishConfirmed = async (customDishName?: string, customDishImage?: string) => {
    playSound('bite');
    const rawDishName = customDishName || selectedDish?.name || 'Signature Food';
    const dishName = formatCleanDishName(rawDishName, selectedRestaurant?.name);
    const visual = getDishVisualAssets(dishName, customDishImage || selectedDish?.image);
    const finalDish = {
      name: dishName,
      id: customDishName ? Math.floor(Math.random() * 80000) + 10000 : ((selectedDish as { id?: number })?.id || 1),
      price: selectedDish?.price || 150,
      image: visual.plateImage || selectedDish?.image || '/images/eating/momos_dish.jpg'
    };

    setSelectedDish(finalDish);
    if (feastingStage !== 2) {
      setFeastingStage(1);
    }
    triggerFrameTransition(5);

    const activeSession = sessionId || getOrCreateSessionId();

    // Persist session and record visit in DB immediately
    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_location: selectedRestaurant?.city || selectedCity,
          latitude: selectedRestaurant?.latitude || userCoords?.lat,
          longitude: selectedRestaurant?.longitude || userCoords?.lng,
          restaurant_id: selectedRestaurant?.id || 1,
          dish_id: (finalDish as { id?: number })?.id || 1,
          current_stage: 'frame_5_eating_begins',
          current_step: 'eating_begins',
          food_meter_percentage: 20
        })
      });

      // Save visit to campaign_visits in DB
      await fetch('/api/campaign/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          restaurant_id: selectedRestaurant?.id || 1,
          restaurant_name: selectedRestaurant?.name || 'Local Food Spot',
          dish_id: (finalDish as { id?: number })?.id || 1,
          dish_name: finalDish.name,
          city: selectedRestaurant?.city || selectedCity || 'Pune',
          latitude: selectedRestaurant?.latitude || userCoords?.lat || 18.5204,
          longitude: selectedRestaurant?.longitude || userCoords?.lng || 73.8407
        })
      });
    } catch (err) {
      console.warn('Dish & visit save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_5_eating_begins',
      stepTitle: `Frame 5: Bakasur Mode ON - Eating ${finalDish.name}`,
      stepNumber: 5,
      restaurantId: selectedRestaurant?.id,
      dishId: (finalDish as { id?: number })?.id,
      userLocation: selectedRestaurant?.city || selectedCity,
      latitude: selectedRestaurant?.latitude || userCoords?.lat,
      longitude: selectedRestaurant?.longitude || userCoords?.lng,
      foodMeterPercentage: 20,
      metadata: {
        dish_name: finalDish.name,
        restaurant_name: selectedRestaurant?.name,
        city: selectedRestaurant?.city || selectedCity
      }
    });
  };

  // Frame 5 -> Frame 6 (Eating Begins -> Feeding Loop)
  const handleFeedMore = async () => {
    playSound('click');
    const activeSession = sessionId || getOrCreateSessionId();

    let nextStage: 1 | 2 | 3 = 2;
    if (feastingStage === 1) {
      nextStage = 2;
      setFeastingStage(2);
      setCurrentFrame(6);
    } else if (feastingStage === 2) {
      nextStage = 3;
      setFeastingStage(3);
      setCurrentFrame(6);
    } else {
      handleFeedingLoopComplete();
      return;
    }

    const newPct = nextStage === 2 ? 60 : 90;

    try {
      await fetch('/api/campaign/aur-khilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: `stage_${nextStage}`
        })
      });
    } catch (err) {
      console.warn('Aur khilo save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_6_feeding_loop',
      stepTitle: `Frame 6: Feeding Loop Progressed (Round ${nextStage})`,
      stepNumber: 6,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: newPct
    });
  };

  // Frame 6 (Interstitial) -> Second Restaurant & Dish Selection for Round 2
  const handleStartSecondEatingStage = () => {
    playSound('click');
    setFeastingStage(2);
    setSelectedRestaurant(null);
    setSelectedDish(null);
    setCurrentFrame(2);
  };

  // Frame 6 (Trailer) -> Random Food Tour Spot 1
  const handleStartFoodTour = async () => {
    playSound('bite');
    const firstSpot = getRandomFoodSpot([]);
    setCurrentTourSpot(firstSpot);
    setVisitedSpotIds([firstSpot.id]);
    setCurrentFrame(6);

    setTourSpotRound(1);
    setFeastingStage(2);

    const activeSession = sessionId || getOrCreateSessionId();

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'frame_6_tour_spot_1',
          current_step: 'tour_spot_1',
          food_meter_percentage: 65
        })
      });
    } catch (err) {
      console.warn('Spot 1 save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: `frame_6_tour_spot_1_${firstSpot.id}`,
      stepTitle: `Frame 6: Random Tour Spot 1 - ${firstSpot.dishName} at ${firstSpot.spotName}`,
      stepNumber: 6,
      foodMeterPercentage: 65,
      metadata: {
        dish_name: firstSpot.dishName,
        spot_name: firstSpot.spotName,
        round: 1
      }
    });
  };

  // Random Food Tour Spot (Eating twice - 2 dishes before acidity kicks in)
  const handleNextTourSpot = async () => {
    const activeSession = sessionId || getOrCreateSessionId();

    if (tourSpotRound === 1) {
      playSound('bite');
      const secondSpot = getRandomFoodSpot(visitedSpotIds);
      setCurrentTourSpot(secondSpot);
      setVisitedSpotIds((prev) => [...prev, secondSpot.id]);
      setTourSpotRound(2);
      setFeastingStage(2);
      return;
    }

    // After Round 3 finishes: Overeating Acidity kicks in!
    playSound('relief');
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    setFeastingStage(3);
    setCurrentFrame(7);

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'acidity',
          current_step: 'acidity_appears',
          food_meter_percentage: 100
        })
      });
    } catch (err) {
      console.warn('Acidity save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_7_acidity_appears',
      stepTitle: 'Frame 7: Bakasur Overeats 2 Food Tour Spots - Acidity Appears',
      stepNumber: 7,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: 100
    });
  };

  // Frame 6 -> Frame 7 (Feeding Loop Complete -> Acidity Appears)
  const handleFeedingLoopComplete = async () => {
    playSound('bite');
    setFeastingStage(3);
    triggerFrameTransition(7);

    const activeSession = sessionId || getOrCreateSessionId();

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'acidity',
          current_step: 'acidity_appears',
          food_meter_percentage: 100
        })
      });
    } catch {}

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_7_acidity_appears',
      stepTitle: 'Frame 7: Acidity Appears (Overeating After Round 3)',
      stepNumber: 7,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: 100
    });
  };

  // Frame 7 -> Frame 8 (Comic Reaction Complete -> Help Bakasur)
  const handleAcidityAutoAdvance = () => {
    triggerFrameTransition(8);
    const activeSession = sessionId || getOrCreateSessionId();
    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_8_help_bakasur',
      stepTitle: 'Frame 8: Bakasur Needs Help Prompt',
      stepNumber: 8,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 8 -> Frame 9 (Help Bakasur Clicked -> Gastrium Dose Animation)
  const handleHelpBakasur = async () => {
    playSound('relief');
    triggerFrameTransition(9);
    const activeSession = sessionId || getOrCreateSessionId();

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'frame_9_gastrium_animation',
          current_step: 'gastrium_dose'
        })
      });
    } catch {}

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_9_gastrium_animation',
      stepTitle: 'Frame 9: Gastrium 4-Message Automatic Relief Sequence Started',
      stepNumber: 9,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 9 -> Frame 11 (Gastrium Animation Finished -> Live Food Tour Map)
  const handleGastriumComplete = async () => {
    playSound('fanfare');
    triggerFrameTransition(11);
    const activeSession = sessionId || getOrCreateSessionId();

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'relief_done',
          current_step: 'recommendation_submitted'
        })
      });
    } catch {}

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_10_recommendation_submitted',
      stepTitle: 'Frame 10: Recommendation Submitted (Mazaa Aa Gaya)',
      stepNumber: 10,
      restaurantId: selectedRestaurant?.id,
      dishId: (selectedDish as { id?: number })?.id,
      metadata: {
        restaurant_name: selectedRestaurant?.name,
        dish_name: selectedDish?.name
      }
    });
  };

  // Frame 10 -> Frame 11 (Recommendation Submitted -> Live Food Tour Map)
  const handleViewMap = async () => {
    playSound('click');
    const activeSession = sessionId || getOrCreateSessionId();

    // Automatically persist visited spot to MySQL DB and mark map_visited = 1
    try {
      await fetch('/api/campaign/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          restaurant_id: selectedRestaurant?.id || 1,
          restaurant_name: selectedRestaurant?.name || 'Local Restaurant',
          dish_id: (selectedDish as { id?: number })?.id || null,
          dish_name: selectedDish?.name || 'Signature Food',
          city: selectedRestaurant?.city || selectedCity || 'Pune',
          latitude: selectedRestaurant?.latitude || userCoords?.lat || 18.5204,
          longitude: selectedRestaurant?.longitude || userCoords?.lng || 73.8407
        })
      });

      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'map',
          current_step: 'live_map',
          map_visited: 1
        })
      });
    } catch (err) {
      console.warn('Failed to record visit to DB:', err);
    }

    triggerFrameTransition(11);
    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_11_live_map',
      stepTitle: 'Frame 11: Live Food Tour Map Explored',
      stepNumber: 11,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 11 -> Frame 2 (Ek Aur Food Stop Jodo)
  const handleAddAnotherSpot = () => {
    playSound('click');
    setSelectedRestaurant(null);
    setSelectedDish(null);
    setFeastingStage(1);
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    triggerFrameTransition(2);
    trackUserStep({
      sessionId,
      stepName: 'frame_11_add_another_spot',
      stepTitle: 'Frame 11: Ek Aur Food Stop Jodo Clicked',
      stepNumber: 11
    });
  };

  // Universal Previous Frame Handler for Top-Left Navigation
  const handleGoPreviousFrame = useCallback(() => {
    playSound('click');
    if (currentFrame === 2) triggerFrameTransition(1);
    else if (currentFrame === 3) triggerFrameTransition(2);
    else if (currentFrame === 4) triggerFrameTransition(3);
    else if (currentFrame === 5) triggerFrameTransition(3);
    else if (currentFrame === 6) {
      if (tourSpotRound > 0) setTourSpotRound(0);
      else triggerFrameTransition(3);
    }
    else if (currentFrame === 7) triggerFrameTransition(6);
    else if (currentFrame === 8) triggerFrameTransition(7);
    else if (currentFrame === 9) triggerFrameTransition(8);
    else if (currentFrame === 10) triggerFrameTransition(9);
    else if (currentFrame === 11) triggerFrameTransition(10);
    else if (currentFrame === 12) triggerFrameTransition(11);
    else if (currentFrame === 13) triggerFrameTransition(12);
  }, [currentFrame, tourSpotRound, playSound, triggerFrameTransition]);

  // Frame 11 -> Frame 12 (Live Map -> Registration Form)
  const handleRegisterLiveTour = () => {
    playSound('click');
    triggerFrameTransition(12);
    trackUserStep({
      sessionId,
      stepName: 'frame_12_registration',
      stepTitle: 'Frame 12: Live Food Tour Registration Form Opened',
      stepNumber: 12
    });
  };

  // Frame 12 -> Frame 13 (Registration Submit -> Confirmation)
  const handleRegistrationSubmit = async (mobile: string, name?: string, concern?: string) => {
    setIsRegistering(true);
    setRegError('');
    try {
      const res = await fetch('/api/campaign/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          mobile,
          name: name || 'Foodie Follower',
          city: selectedRestaurant?.city || selectedCity,
          restaurant_id: selectedRestaurant?.id || null,
          restaurant_name: selectedRestaurant?.name || null,
          dish_id: (selectedDish as { id?: number })?.id || null,
          dish_name: selectedDish?.name || null,
          latitude: selectedRestaurant?.latitude || 18.5204,
          longitude: selectedRestaurant?.longitude || 73.8407,
          consent: true,
          terms_accepted: true,
          user_concern: concern
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        playSound('fanfare');
        setRegisteredMobile(mobile);
        setParticipationId(json.data.participation_id || 'BKT-' + Math.floor(100000 + Math.random() * 900000));
        setCurrentFrame(13);

        trackUserStep({
          sessionId,
          stepName: 'frame_13_confirmation',
          stepTitle: `Frame 13: Tour Pass Confirmed (${json.data.participation_id})`,
          stepNumber: 13,
          metadata: { mobile, participation_id: json.data.participation_id, user_concern: concern }
        });
        return true;
      } else {
        if (json.alreadyRegistered && json.data?.participation_id) {
          setParticipationId(json.data.participation_id);
          setRegisteredMobile(mobile);
        }
        setRegError(json.error || 'Registration failed. Please try again.');
        return false;
      }
    } catch {
      setRegError('Server error. Please try again.');
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  // Restart Food Tour (Back to Frame 1 / Frame 2 with a clean session)
  const handleRestart = () => {
    playSound('click');
    const newSess = resetSessionId();
    setSessionId(newSess);
    setSelectedRestaurant(null);
    setSelectedDish(null);
    setFeastingStage(1);
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    setVisitedSpotIds([]);
    setCurrentFrame(1);

    trackUserStep({
      sessionId: newSess,
      stepName: 'frame_1_welcome',
      stepTitle: 'Food Tour Restarted - Fresh Session Initiated',
      stepNumber: 1
    });
  };

  const getVideoContainerHeightClass = (frame: number) => {
    if (frame === 8) {
      return 'h-[66%] xs:h-[68%] md:h-full';
    }
    if (frame === 3 || frame === 4) {
      return 'h-[65%] xs:h-[67%] md:h-full';
    }
    return 'h-[62%] xs:h-[65%] md:h-full';
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center bg-[#050b1e] overflow-hidden select-none p-0 md:p-6 lg:p-8">
      {/* Responsive Canvas: Mobile portrait stack (< md), Desktop split screen (md:flex-row, Left: Video, Right: Content) */}
      {/* If Frame 5: FULL SCREEN EATING STAGE */}
      {currentFrame === 5 ? (
        <div className="w-full h-full md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] bg-[#031058] md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative">
          <BakasurEatingStage
            dishName={selectedDish?.name || 'Signature Dish'}
            dishImage={selectedDish?.image}
            restaurantName={selectedRestaurant?.name}
            restaurant={selectedRestaurant}
            feastingStage={feastingStage}
            soundEnabled={false}
            onBack={() => {
              setCurrentFrame(3);
            }}
            onWatchVideo={() => {
              setActiveTransitionVideo({
                videoUrl: '/images/final-frames/Bhookasur-Food-Eating-new.mp4',
                buttonText: 'Aage Badho ➡️',
                nextFrame: 7
              });
            }}
            onComplete={() => {
              playSound('click');
              if (feastingStage === 1) {
                setCurrentFrame(6);
              } else {
                handleFeedingLoopComplete();
              }
            }}
            onPlayBite={() => playSound('bite')}
          />
        </div>
      ) : currentFrame === 6 && tourSpotRound === 0 ? (
        /* Frame 6 Interstitial with bakasur_empty_plate video & smooth zoom-out reveal animation */
        <div className="w-full h-full md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] bg-[#07153B] md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative flex flex-col">
          <Frame6FeedingLoop
            restaurant={selectedRestaurant || { id: 1, name: 'Local Restaurant', city: 'Pune' }}
            dish={selectedDish || { name: 'Signature Food', id: 1 }}
            onCompleteLoop={handleStartSecondEatingStage}
            onBack={() => setCurrentFrame(5)}
          />
        </div>
      ) : currentFrame === 7 ? (
        /* Frame 7 Acidity Appears with Fire on stomach video & smooth zoom-out reveal animation */
        <div className="w-full h-full md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] bg-[#07153B] md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative flex flex-col">
          <Frame7AcidityAppears
            onAutoAdvance={handleAcidityAutoAdvance}
            onBack={() => setCurrentFrame(6)}
            soundEnabled={false}
          />
        </div>
      ) : currentFrame === 6 && tourSpotRound > 0 && currentTourSpot ? (
        <div className="w-full h-full md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] bg-white md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative">
          <Frame6RandomFoodSpot
            spot={currentTourSpot}
            round={tourSpotRound}
            soundEnabled={false}
            onBack={() => setTourSpotRound(0)}
            onFeedMore={handleNextTourSpot}
          />
        </div>
      ) : currentFrame === 11 ? (
        /* Standalone Map Frame matching user_mockup_map.png */
        /* Desktop: Horizontal side-by-side (md:max-w-5xl lg:max-w-6xl), Mobile: Exact phone card (max-w-[440px]) */
        <div className="w-full h-full max-w-[440px] md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] bg-white md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative flex flex-col">
          <Frame11LiveMap
            sessionId={sessionId}
            currentUserSpot={selectedRestaurant ? {
              name: selectedRestaurant.name,
              city: selectedRestaurant.city,
              dishName: selectedDish?.name || 'Specialty Dish',
              latitude: selectedRestaurant.latitude,
              longitude: selectedRestaurant.longitude
            } : null}
            onRegisterLiveTour={handleRegisterLiveTour}
            onSuggestAnotherSpot={handleAddAnotherSpot}
            onRegisterSubmit={handleRegistrationSubmit}
            isRegistering={isRegistering}
            regError={regError}
            onViewExistingPass={(data) => {
              playSound('fanfare');
              setRegisteredMobile(data.mobile);
              setParticipationId(data.participation_id);
              setCurrentFrame(13);
              trackUserStep({
                sessionId,
                stepName: 'frame_13_confirmation',
                stepTitle: `Frame 13: Existing Tour Pass Claimed (${data.participation_id})`,
                stepNumber: 13,
                metadata: { mobile: data.mobile, participation_id: data.participation_id, is_existing: true }
              });
            }}
          />
        </div>
      ) : currentFrame === 13 ? (
        /* Frame 13: Last Frame (Registration Completed) */
        /* Desktop view is horizontal (md:flex-row), Mobile view is vertical (flex-col) */
        <div className="w-full h-full md:max-w-4xl lg:max-w-5xl md:h-[88vh] md:max-h-[820px] bg-white md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative flex flex-col md:flex-row">
          <Frame13Confirmation
            participationId={participationId}
            mobile={registeredMobile}
            restaurant={selectedRestaurant}
            dish={selectedDish}
            onBackToMap={() => setCurrentFrame(11)}
            onRestart={handleRestart}
          />
        </div>
      ) : (
        /* Normal Canvas for Other Frames */
        <div className={`w-full h-full md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] ${currentFrame === 1 ? 'bg-[#f4f6fa]' : 'bg-white'} md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden flex flex-col md:flex-row relative`}>
          
          {/* Left Side on Desktop / Top Half on Mobile: Royal Blue Character Stage */}
          <div className={`w-full md:w-1/2 ${getVideoContainerHeightClass(currentFrame)} md:h-full relative overflow-hidden bg-[#182858] shrink-0`}>
            <BakasurVideoPlayer
              videoUrl={
                currentFrame === 1
                  ? "/images/final-frames/1.mp4"
                  : currentFrame === 2
                  ? "/images/final-frames/2.mp4"
                  : currentFrame === 3 || currentFrame === 4
                  ? "/images/final-frames/3.mp4"
                  : currentFrame === 6
                  ? "/images/all-frames/Showing Love.mp4"
                  : currentFrame === 8
                  ? "/images/final-frames/Acidity-and-Dakare.mp4"
                  : currentFrame === 9
                  ? "/images/all-frames/Drinking Gastrium.mp4"
                  : currentFrame === 10
                  ? "/images/all-frames/Thumbs Up.mp4"
                  : currentFrame === 12
                  ? "/images/all-frames/Showing Love.mp4"
                  : "/images/final-frames/1.mp4"
              }
              stageName={
                currentFrame === 1 ? 'welcome' :
                currentFrame === 2 ? 'restaurant' :
                currentFrame === 3 || currentFrame === 4 ? 'dish' :
                currentFrame === 6 ? 'trailer' :
                currentFrame === 8 ? 'heartburn' :
                currentFrame === 9 ? 'relief' :
                currentFrame === 10 ? 'relief_done' : 'map'
              }
              frameNumber={currentFrame}
              feastingStage={feastingStage}
              dishName={selectedDish?.name || 'Signature Food'}
              dishImage={selectedDish?.image}
              restaurantName={selectedRestaurant?.name}
              soundEnabled={false}
              onBack={currentFrame > 1 ? handleGoPreviousFrame : undefined}
            />
          </div>

          {/* Right Side on Desktop / Bottom Half on Mobile: Content Card */}
          <div className={`w-full md:w-1/2 flex-1 md:h-full flex flex-col overflow-y-auto scrollbar-thin ${currentFrame === 1 ? 'bg-[#f4f6fa] p-0' : currentFrame <= 3 || currentFrame === 9 ? 'bg-white p-0' : 'bg-white p-2 sm:p-4 md:p-6 lg:p-8'} text-slate-900 relative z-20 justify-start md:justify-center`}>
            <main className="flex-1 w-full flex flex-col justify-start md:justify-center min-h-0 relative">
              {/* Frame 1: Welcome */}
              {currentFrame === 1 && (
                <Frame1Welcome onStart={handleStartTour} cityName={selectedCity} />
              )}

              {/* Frame 2: Restaurant Search */}
              {currentFrame === 2 && (
                <Frame2RestaurantSearch
                  selectedCity={selectedCity}
                  selectedRestaurant={selectedRestaurant}
                  userCoords={userCoords}
                  isSecondRound={feastingStage === 2}
                  onSelectRestaurant={(r) => {
                    setSelectedRestaurant(r);
                    if (r.city) {
                      setSelectedCity(r.city);
                    }
                  }}
                  onNext={handleRestaurantConfirmed}
                  onWatchVideo={() => {
                    setActiveTransitionVideo({
                      videoUrl: '/images/final-frames/Bhookasur-Food-Eating-new.mp4',
                      buttonText: 'Aage Badho ➡️',
                      nextFrame: 2
                    });
                  }}
                  onBack={() => {
                    if (feastingStage === 2) {
                      setCurrentFrame(6);
                    } else {
                      setCurrentFrame(1);
                    }
                  }}
                />
              )}

              {/* Frame 3: Dish Selection (3 Options) */}
              {currentFrame === 3 && selectedRestaurant && (
                <Frame3DishSelection
                  restaurant={selectedRestaurant}
                  selectedDish={selectedDish}
                  onSelectDish={(d) => setSelectedDish(d)}
                  onConfirmDish={(name, img) => handleDishConfirmed(name, img)}
                  onManualEntry={handleGoToManualDish}
                  onBack={() => setCurrentFrame(2)}
                />
              )}

              {/* Frame 4: Manual Dish Entry */}
              {currentFrame === 4 && selectedRestaurant && (
                <Frame4ManualDish
                  restaurant={selectedRestaurant}
                  onCustomDishSubmit={(dishName, dishImage) => handleDishConfirmed(dishName, dishImage)}
                  onBackToOptions={() => setCurrentFrame(3)}
                />
              )}



            {/* Frame 8: Help Bakasur */}
            {currentFrame === 8 && (
              <Frame8HelpBakasur onHelpBakasur={handleHelpBakasur} />
            )}

            {/* Frame 9: Gastrium Animation (4 sequential messages + end line) */}
            {currentFrame === 9 && (
              <Frame9GastriumAnimation onAnimationComplete={handleGastriumComplete} />
            )}

            {/* Frame 10: Shukriya Dost / Map Par Dekho (Matching User Mockup 2) */}
            {currentFrame === 10 && (
              <Frame10Submitted
                restaurant={selectedRestaurant || { id: 1, name: 'Local Restaurant', city: selectedCity || 'Pune' }}
                dish={selectedDish || { name: 'Signature Food' }}
                onViewMap={handleViewMap}
              />
            )}

            {/* Frame 12: Registration (Mobile number & consent) */}
            {currentFrame === 12 && (
              <Frame12Registration
                onSubmitNumber={async (m, n) => { await handleRegistrationSubmit(m, n); }}
                onBack={() => setCurrentFrame(11)}
                isLoading={isRegistering}
                error={regError}
                onViewExistingPass={(data) => {
                  playSound('fanfare');
                  setRegisteredMobile(data.mobile);
                  setParticipationId(data.participation_id);
                  setCurrentFrame(13);
                  trackUserStep({
                    sessionId,
                    stepName: 'frame_13_confirmation',
                    stepTitle: `Frame 13: Existing Tour Pass Claimed (${data.participation_id})`,
                    stepNumber: 13,
                    metadata: { mobile: data.mobile, participation_id: data.participation_id, is_existing: true }
                  });
                }}
              />
            )}

          </main>
        </div>
      </div>
      )}

      {/* Full-width Story Video Transition Overlay between frames */}
      {activeTransitionVideo && (
        <VideoTransitionOverlay
          key={activeTransitionVideo.videoUrl}
          videoUrl={activeTransitionVideo.videoUrl}
          buttonText={activeTransitionVideo.buttonText}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onComplete={() => {
            const callback = activeTransitionVideo.onVideoComplete;
            const next = activeTransitionVideo.nextFrame;
            setActiveTransitionVideo(null);
            if (callback) {
              setTimeout(() => {
                callback();
              }, 50);
            } else {
              setCurrentFrame(next);
            }
          }}
        />
      )}

      {/* Bakasur Universal Walking Preloader Overlay */}
      <BakasurTransitionLoader
        isOpen={isLoaderOpen}
        targetFrame={targetLoaderFrame}
        customMessage={loaderMessage}
        onFinish={() => {
          setIsLoaderOpen(false);
        }}
      />
    </div>
  );
}
