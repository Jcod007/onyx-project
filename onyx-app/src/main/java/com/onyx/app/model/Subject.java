package com.onyx.app.model;

public class Subject {
	
	private String name;
	private Status status;
	private int studyGoalInMinutes;
	private int timesSpendInMinutes;
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public int getStudyGoalInMinutes() {
		return studyGoalInMinutes;
	}
	public void setStudyGoalInMinutes(int studyGoalInMinutes) {
		this.studyGoalInMinutes = studyGoalInMinutes;
	}
	public int getTimesSpendInMinutes() {
		return timesSpendInMinutes;
	}
	public void setTimesSpendInMinutes(int timesSpendInMinutes) {
		this.timesSpendInMinutes = timesSpendInMinutes;
	}
	
	public enum Status
	{
		IN_PROCESS,
		COMPLETED,
		NOT_STARTED
	}
}
