package com.app.timer.model;

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
		convertOverflow();
		this.initMinutes = this.minutes;
		this.initSeconds = this.seconds;
		this.initHours = this.hours;
		
	}

	private void convertOverflow() {
		if (seconds > 59) {
			minutes += seconds / 60;
			seconds = (byte) (seconds % 60);
		}
		if (minutes > 59) {
			hours += minutes / 60;
			minutes = (byte) (minutes % 60);
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
		return String.format("%02d:%02d:%02d", hours, minutes, seconds);
	}

	
}
