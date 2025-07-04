package com.onyx.app.model;

public class TimerModel {
	private byte minutes;
	private byte seconds;
	private byte hours;
	private final byte initMinutes;
	private final byte initSeconds;
	private final byte initHours;

	public TimerModel(byte hours, byte minutes, byte seconds) {

		this.hours = hours;
		this.minutes = minutes;
		this.seconds = seconds;
		convertAndClamp();
		this.initMinutes = this.minutes;
		this.initSeconds = this.seconds;
		this.initHours = this.hours;

	}

	 private void convertAndClamp() {
	        // NOUVEAU: Stratégie de saturation au lieu d'overflow
	        
	        // Si on dépasse les limites absolues, on sature directement
	        if (hours > 99 || minutes > 59 || seconds > 59) {
	            // Saturation complète
	            if (hours > 99) {
	                hours = 99;
	                minutes = 59;
	                seconds = 59;
	                checkValue();
	                return;
	            }
	        }
	        
	        // Sinon, overflow normal puis clamp
	        if (seconds > 59) {
	            minutes += seconds / 60;
	            seconds = (byte) (seconds % 60);
	        }
	        if (minutes > 59) {
	            hours += minutes / 60;
	            minutes = (byte) (minutes % 60);
	        }
	        
	        // Clamp final après overflow
	        if (hours > 99) {
	            hours = 99;
	            minutes = 59;
	            seconds = 59;
	        }
	        
	        checkValue();
	    }

	private void checkValue() {
		if (hours < 0 || minutes < 0 || seconds < 0) {
			throw new IllegalArgumentException("Invalid values: negative time not allowed");
		}
	}

	public void decrement() {
		if (hours == 0 && minutes == 0 && seconds == 0) {
			return;
		}
		if (seconds > 0) {
			seconds--;
		} else {
			seconds = 59;
			if (minutes > 0) {
				minutes--;
			} else {
				minutes = 59;
				if (hours > 0) {
					hours--;
				}
			}
		}
	}

	public byte getMinutes() {
		return minutes;
	}

	public void setMinutes(byte minutes) {
		this.minutes = minutes;
	}

	public byte getSeconds() {
		return seconds;
	}

	public void setSeconds(byte seconds) {
		this.seconds = seconds;
	}

	public byte getHours() {
		return hours;
	}

	public void setHours(byte hours) {
		this.hours = hours;
	}

	public void reset() {
		hours = initHours;
		minutes = initMinutes;
		seconds = initSeconds;
	}

	public boolean isFinished() {
		return hours == 0 && minutes == 0 && seconds == 0;
	}

	public boolean isInitialValue() {
		return minutes == initMinutes && seconds == initSeconds && hours == initHours;
	}

	@Override
	public String toString() {
	    if (hours > 0) {
	        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
	    } else if (minutes > 0) {
	        return String.format("%02d:%02d", minutes, seconds);
	    } else {
	        return String.format("%d", seconds);
	    }
	}
	
	public String getFormattedTime()
	{
		return String.format("%02d:%02d:%02d", hours, minutes, seconds);
	}
	

}
