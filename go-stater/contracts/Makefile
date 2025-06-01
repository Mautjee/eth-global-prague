#!/usr/bin/env gmake

include ../common.mk

.PHONY: all MessageBox Vigil clean

all: MessageBox
	@printf "$(CYAN)*** Contracts built successfully!$(OFF)\n"

MessageBox:
	@printf "$(CYAN)*** Building contract: $(BLUE)MessageBox$(CYAN)...$(OFF)\n"
	@$(MAKE) -C message-box

Vigil:
	@printf "$(CYAN)*** Building contract: $(BLUE)Vigil$(CYAN)...$(OFF)\n"
	@$(MAKE) -C vigil
	
clean:
	@printf "$(CYAN)*** Cleaning up...$(OFF)\n"
	@$(MAKE) -C message-box clean
	@$(MAKE) -C vigil clean

