package com.onyx.app.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class StudyDeck {

	private List<Subject> subjectList = new ArrayList<>();
	
	public boolean addSubject(Subject subject)
	{
		return subjectList.add(subject);
		
	}
	
	public boolean removeSubject(Subject subject)
	{
		return subjectList.remove(subject);
	}

	public List<Subject> getSubjectList() {
		return (List<Subject>) Collections.unmodifiableCollection(subjectList);
	}
	
	
}
